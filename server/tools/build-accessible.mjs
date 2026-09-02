#!/usr/bin/env node
/**
 * build-accessible.mjs
 * Generates the accessible text version of a course deck (or all of them),
 * plus the accessible course-home page.
 *
 * Usage:
 *   node server/tools/build-accessible.mjs web-fundamentals-workshop
 *   node server/tools/build-accessible.mjs --all
 *   node server/tools/build-accessible.mjs --home     # just accessible/index.html
 *
 * --all also rewrites the ACCESSIBLE_VERSIONS manifest in index.html and
 * rebuilds accessible/index.html so every generated page is linked.
 *
 * Output: accessible/<deck>.html — semantic, JS-free, honours browser zoom and
 * screen readers, light/dark via prefers-color-scheme.
 */

import { readFileSync, writeFileSync, existsSync, readdirSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';
import { parse } from 'node-html-parser';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const args = process.argv.slice(2);
const DO_ALL = args.includes('--all');
const DO_HOME = args.includes('--home');
const ONE = args.find(a => !a.startsWith('--'));

// ─── shared page shell ──────────────────────────────────────────────────────
const STYLE = `
  :root { --bg:#fff; --text:#1a1a1a; --muted:#4a4a4a; --rule:#d0d0d0; --accent:#0b5fa5; --code-bg:#f4f4f4; --card-bg:#f7f7f7; }
  @media (prefers-color-scheme: dark) {
    :root { --bg:#14171c; --text:#e8e8e8; --muted:#b3b3b3; --rule:#3a3f47; --accent:#6fb3ff; --code-bg:#1e222a; --card-bg:#1b1f26; }
  }
  * { box-sizing: border-box; }
  body { margin:0; background:var(--bg); color:var(--text);
    font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif; line-height:1.7; }
  .wrap { max-width:44rem; margin:0 auto; padding:2rem 1.25rem 5rem; }
  a { color:var(--accent); }
  a:focus-visible, button:focus-visible { outline:3px solid var(--accent); outline-offset:2px; }
  .skip { position:absolute; left:-9999px; top:0; background:var(--accent); color:#fff; padding:.6rem 1rem; border-radius:0 0 6px 0; z-index:10; }
  .skip:focus { left:0; }
  header.doc { border-bottom:2px solid var(--rule); padding-bottom:1.25rem; margin-bottom:1.5rem; }
  h1 { font-size:1.9rem; line-height:1.25; margin:0 0 .4rem; }
  .kicker { font-size:.8rem; letter-spacing:.12em; text-transform:uppercase; color:var(--muted); margin:0 0 .6rem; }
  .lede { font-size:1.05rem; color:var(--muted); margin:.75rem 0 0; }
  .note { background:var(--card-bg); border:1px solid var(--rule); border-left:4px solid var(--accent);
    padding:.9rem 1.1rem; border-radius:4px; margin:1.25rem 0; font-size:.97rem; }
  .note p { margin:.4rem 0; } .note p:first-child { margin-top:0; } .note p:last-child { margin-bottom:0; }
  .note .note-label { display:block; font-size:.72rem; font-weight:700; letter-spacing:.08em; text-transform:uppercase; color:var(--accent); margin-bottom:.25rem; }
  nav.toc { margin:1.5rem 0 2.5rem; }
  nav.toc h2 { font-size:1rem; text-transform:uppercase; letter-spacing:.08em; color:var(--muted); border:0; margin:0 0 .5rem; padding:0; }
  nav.toc ol { margin:0; padding-left:1.4rem; } nav.toc li { margin:.3rem 0; }
  section { margin:2.75rem 0; }
  h2 { font-size:1.4rem; line-height:1.3; margin:0 0 .5rem; padding-top:.5rem; border-top:1px solid var(--rule); }
  section:first-of-type h2 { border-top:0; padding-top:0; }
  h3 { font-size:1.08rem; margin:1.5rem 0 .5rem; }
  p { margin:.85rem 0; }
  ul, ol { padding-left:1.4rem; } li { margin:.35rem 0; }
  .narration { color:var(--text); }
  figure { margin:1.1rem 0; }
  figcaption { font-size:.85rem; color:var(--muted); margin-bottom:.35rem; }
  .figure-note { font-size:.9rem; color:var(--muted); font-style:italic; }
  pre { background:var(--code-bg); border:1px solid var(--rule); border-radius:4px; padding:.9rem 1rem;
    overflow-x:auto; -webkit-overflow-scrolling:touch; font-size:.9rem; line-height:1.6; }
  code { font-family:"SF Mono","Fira Code",Consolas,"Courier New",monospace; }
  p code, li code, td code { background:var(--code-bg); padding:.1em .35em; border-radius:3px; font-size:.92em; }
  blockquote.prompt { margin:1.1rem 0; padding:.8rem 1.1rem; border-left:4px solid var(--accent); background:var(--card-bg); border-radius:4px; }
  blockquote.prompt .note-label { display:block; font-size:.72rem; font-weight:700; letter-spacing:.08em; text-transform:uppercase; color:var(--accent); margin-bottom:.3rem; }
  .table-scroll { overflow-x:auto; -webkit-overflow-scrolling:touch; margin:1rem 0; }
  table { border-collapse:collapse; width:100%; min-width:30rem; font-size:.95rem; }
  caption { text-align:left; font-weight:600; margin-bottom:.5rem; }
  th, td { border:1px solid var(--rule); padding:.5rem .7rem; text-align:left; vertical-align:top; }
  th { background:var(--card-bg); }
  .checkpoint { border:1px dashed var(--rule); border-radius:4px; padding:.7rem 1rem; color:var(--muted); font-size:.95rem; margin:1.25rem 0; }
  dl.tasks div { padding:.7rem 0; border-bottom:1px solid var(--rule); }
  dl.tasks dt { font-weight:700; }
  dl.tasks dd { margin:.3rem 0 0; color:var(--muted); }
  dl.tasks ul { margin:.3rem 0 0; }
  footer.doc { margin-top:3.5rem; padding-top:1.5rem; border-top:2px solid var(--rule); font-size:.92rem; color:var(--muted); }
  @media (prefers-reduced-motion: reduce) { * { transition-duration:.001ms !important; } }
`;

function page({ title, body }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<style>${STYLE}</style>
</head>
<body>
<a class="skip" href="#main">Skip to content</a>
<div class="wrap">
${body}
</div>
</body>
</html>
`;
}

// ─── helpers ────────────────────────────────────────────────────────────────
const ENT = s => String(s)
  .replace(/&nbsp;/g, ' ').replace(/&mdash;/g, '—').replace(/&ndash;/g, '–')
  .replace(/&rarr;/g, '→').replace(/&larr;/g, '←').replace(/&hellip;/g, '…')
  .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
  .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n))
  .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
  .replace(/&quot;/g, '"').replace(/&apos;/g, "'");
const esc = s => ENT(String(s)).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const slug = s => ENT(String(s)).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const clean = s => ENT(String(s)).replace(/\s+/g, ' ').trim();
const textOf = node => clean(node.text);
const GLYPH = /[✓✗▶●◎→·▸]/;
const tidy = s => s
  .replace(/ {2,}/g, ' ')
  .replace(/([A-Za-z0-9])(<(?:code|strong|em|a)\b)/g, '$1 $2')
  .replace(/(<\/(?:code|strong|em|a)>)([A-Za-z0-9(])/g, '$1 $2')
  .replace(new RegExp('(' + GLYPH.source + ')([A-Za-z])', 'g'), '$1 $2')
  .replace(/ ([,;])(?=\s|$|<)/g, '$1')
  .replace(/ \.(?=\s|$|<)/g, '.')
  .trim();

const INLINE = new Set(['strong', 'b', 'em', 'i', 'code', 'a', 'span', 'br', 'sup', 'sub', 'small', 'mark', 'u', 'kbd']);

function hasBlockChild(el) {
  return el.childNodes.some(c => c.nodeType === 1 && !INLINE.has((c.rawTagName || '').toLowerCase()));
}

// render a node's children as inline HTML (keeps strong/em/code/a)
function inline(node) {
  let out = '';
  for (const c of node.childNodes) {
    if (c.nodeType === 3) { out += esc(c.rawText.replace(/\s+/g, ' ')); continue; }
    const tag = (c.rawTagName || '').toLowerCase();
    if (/\b(badge|pill|part-num)\b/.test(c.getAttribute?.('class') || '')) continue;   // decorative chip
    const t = inline(c);
    if (tag === 'br') { out += ' '; continue; }
    if (!t.trim() && tag !== 'a') continue;
    if (tag === 'strong' || tag === 'b') out += `<strong>${t.trim()}</strong>`;
    else if (tag === 'em' || tag === 'i') out += `<em>${t.trim()}</em>`;
    else if (tag === 'code' || tag === 'kbd') out += `<code>${t.trim()}</code>`;
    else if (tag === 'a') {
      const href = c.getAttribute('href') || '#';
      out += `<a href="${esc(href)}"${/^https?:/.test(href) ? ' rel="noopener"' : ''}>${t.trim() || esc(href)}</a>`;
    } else out += t;
  }
  return tidy(out);
}

// ─── slide element -> accessible blocks ─────────────────────────────────────
// buffers runs of inline content into <p>, renders block elements individually
function renderChildren(node, ctx) {
  const parts = [];
  let buf = '';
  const flush = () => {
    const t = tidy(buf);
    if (t) parts.push(`<p>${t}</p>`);
    buf = '';
  };
  for (const c of node.childNodes) {
    if (c.nodeType === 3) { buf += esc(c.rawText.replace(/\s+/g, ' ')); continue; }
    const tag = (c.rawTagName || '').toLowerCase();
    const kcls = c.getAttribute && (c.getAttribute('class') || '');
    if (INLINE.has(tag)) {
      if (tag === 'span' && /\b(badge|tag|pill)\b/.test(kcls)) continue;   // decorative chip
      buf += inline(c) + ' ';
      continue;
    }
    flush();
    const block = renderEl(c, ctx);
    if (block) parts.push(block);
  }
  flush();
  return parts.filter(Boolean).join('\n');
}

function renderEl(el, ctx) {
  const tag = (el.rawTagName || '').toLowerCase();
  const cls = el.getAttribute('class') || '';
  const has = c => cls.split(/\s+/).includes(c);

  if (!tag) return '';
  if (tag === 'script' || tag === 'style' || tag === 'svg' && false) return '';

  // headings
  if (tag === 'h1' || tag === 'h2') {
    if (ctx.gotHeading) return `<h3>${inline(el)}</h3>`;
    ctx.gotHeading = true;
    return '';                       // consumed as the <section> heading
  }
  if (tag === 'h3' || tag === 'h4') return `<h3>${inline(el)}</h3>`;

  if (has('slide-label')) return '';
  if (has('subtitle')) return ctx.isFirst ? '' : `<p class="lede">${inline(el)}</p>`;
  if (has('tag-row') || has('meta') || has('badge')) return '';   // decorative chips

  // paragraphs / generic text
  if (tag === 'p') { const t = inline(el); return t ? `<p>${t}</p>` : ''; }

  // lists
  if (tag === 'ul' || tag === 'ol') {
    if (has('annot-list')) {
      const numbered = !!el.querySelector('.badge-num');
      const items = el.querySelectorAll('li').map(li => {
        const badge = li.querySelector('.badge');
        const spans = li.querySelectorAll('span');
        const rest = inline(spans.length ? spans[spans.length - 1] : li);
        if (numbered) return `<li>${rest}</li>`;               // <ol> renumbers
        if (badge && spans.length >= 2) {
          return `<li><strong>${esc(textOf(badge))}</strong> &mdash; ${rest}</li>`;
        }
        return `<li>${inline(li)}</li>`;
      }).join('\n');
      return numbered ? `<ol>\n${items}\n</ol>` : `<ul>\n${items}\n</ul>`;
    }
    const items = el.querySelectorAll(':scope > li').map(li => `<li>${inline(li)}</li>`).join('\n');
    return `<${tag}>\n${items}\n</${tag}>`;
  }

  // callouts -> aside note, labelled by icon variant
  if (has('callout')) {
    const label = has('icon-key') ? 'Key concept'
      : has('icon-gotcha') ? 'Gotcha'
      : has('icon-tip') ? 'Tip'
      : has('icon-hands-on') ? 'Hands-on'
      : has('callout-red') ? 'Warning'
      : null;
    const inner = renderChildren(el, { ...ctx, gotHeading: true }) || `<p>${inline(el)}</p>`;
    return `<aside class="note">${label ? `<span class="note-label">${label}</span>` : ''}${inner}</aside>`;
  }

  // prompt block
  if (has('prompt-block')) {
    const bar = el.querySelector('.prompt-bar');
    const bodyEl = el.querySelector('.prompt-body') || el;
    const inner = renderChildren(bodyEl, { ...ctx, gotHeading: true }) || `<p>${inline(bodyEl)}</p>`;
    const cap = bar ? clean(textOf(bar).replace(/^[^A-Za-z]*/, '')) : 'Prompt';
    return `<blockquote class="prompt"><span class="note-label">${esc(cap || 'Prompt')}</span>${inner}</blockquote>`;
  }

  const codeBlock = (raw, cap) => {
    let t = ENT(raw).replace(/\u00a0/g, ' ').replace(/[ \t]+$/gm, '').replace(/\n{3,}/g, '\n\n').trim();
    t = t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const body = `<pre><code>${t}</code></pre>`;
    return cap ? `<figure><figcaption>${esc(cap)}</figcaption>${body}</figure>` : body;
  };

  // terminal / code
  if (has('terminal')) {
    const bodyEl = el.querySelector('.terminal-body');
    if (!bodyEl) return '';
    const labelEl = el.querySelector('.terminal-label');
    return codeBlock(bodyEl.text, labelEl ? clean(textOf(labelEl)) : '');
  }
  if (has('diagram') || has('filetree')) return codeBlock(el.text, '');

  // n8n workflow flow diagram -> one line: Node (Type) → Node (Type) → …
  if (has('n8n-flow')) {
    const steps = el.querySelectorAll('.n8n-node').map(n => {
      const name = clean(n.querySelector('.node-name')?.text || n.text);
      const type = clean(n.querySelector('.node-type')?.text || '');
      return type && type.toLowerCase() !== name.toLowerCase() ? `${name} (${type})` : name;
    });
    return steps.length ? `<figure><figcaption>Workflow</figcaption><p class="figure-note">${esc(steps.join(' → '))}</p></figure>` : '';
  }
  {
    const st = el.getAttribute('style') || '';
    if (tag === 'div' && (/font-family[^;]*mono/i.test(st) || /term-bg/.test(st))) return codeBlock(el.text, '');
  }
  if (has('pill') || has('part-num')) return '';   // decorative section label

  // tables
  if (tag === 'table') {
    const rows = [];
    const headRow = el.querySelector('thead tr') || el.querySelector('tr');
    const headCells = headRow ? headRow.querySelectorAll('th, td') : [];
    let thead = '';
    if (headCells.length) {
      thead = `<thead><tr>${headCells.map(c => `<th scope="col">${inline(c)}</th>`).join('')}</tr></thead>`;
    }
    const bodyRows = el.querySelectorAll('tbody tr').length ? el.querySelectorAll('tbody tr') : el.querySelectorAll('tr').slice(headCells.length ? 1 : 0);
    for (const tr of bodyRows) {
      const cells = tr.querySelectorAll('th, td');
      const tds = cells.map((c, i) => i === 0
        ? `<th scope="row">${inline(c)}</th>`
        : `<td>${inline(c)}</td>`).join('');
      rows.push(`<tr>${tds}</tr>`);
    }
    return `<div class="table-scroll"><table>${thead}<tbody>${rows.join('')}</tbody></table></div>`;
  }

  // svg diagram -> describe from its <text> labels
  if (tag === 'svg') {
    const labels = el.querySelectorAll('text').map(t => clean(t.text)).filter(Boolean);
    if (!labels.length) return '';
    return `<figure><figcaption>Diagram</figcaption><p class="figure-note">${esc(labels.join(' \u2192 '))}</p></figure>`;
  }

  // wrappers -> recurse; a bare div with no block children -> a paragraph
  if (tag === 'div' || has('cols')) {
    if (hasBlockChild(el)) return renderChildren(el, ctx);
    const t = inline(el);
    return t ? `<p>${t}</p>` : '';
  }

  // fallback
  const t = inline(el);
  return t ? `<p>${t}</p>` : '';
}

// ─── narration extraction ──────────────────────────────────────────────────
function loadNarration(deck) {
  const f = path.join(ROOT, `${deck}.scripts.js`);
  if (!existsSync(f)) return null;
  const raw = readFileSync(f, 'utf8');
  const m = raw.match(/window\.DECK_SCRIPTS\s*=\s*(\{[\s\S]*\})\s*;?\s*$/);
  if (!m) return null;
  try {
    const obj = JSON.parse(m[1]);
    const map = {};
    for (const s of obj.scripts || []) map[s.slide] = s.script;
    return map;
  } catch { return null; }
}

// pull a `window.X = [...]` / `= {...}` literal from a deck's inline script.
// The literal ends at a `];`/`};` that sits at column 0 (course convention).
function loadDeckGlobal(html, name) {
  const start = html.search(new RegExp(`window\\.${name}\\s*=\\s*[\\[{]`));
  if (start < 0) return null;
  const open = html.slice(start).search(/[\[{]/) + start;
  const openCh = html[open];
  const closeCh = openCh === '[' ? ']' : '}';
  const endRe = new RegExp(`\\n\\${closeCh};`);
  const rest = html.slice(open);
  const endM = rest.match(endRe);
  const lit = endM ? rest.slice(0, endM.index + 2) : null;
  if (!lit) return null;
  try { return Function(`"use strict";return (${lit});`)(); } catch { return null; }
}

// ─── index.html metadata: MODULE_LOS + card blurbs ─────────────────────────
function loadCourseMeta() {
  const idx = readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const los = loadDeckGlobal(idx, 'MODULE_LOS') || {};
  const byFile = {};
  for (const [code, m] of Object.entries(los)) byFile[m.file] = { code, ...m };

  const root = parse(idx);
  const tracks = [];
  // fold in card blurbs (desc) from the track sections
  for (const card of root.querySelectorAll('.card')) {
    const href = (card.getAttribute('href') || '').replace(/\.html$/, '');
    if (!href) continue;
    const desc = clean(card.querySelector('.card-desc')?.text || '');
    byFile[href] = { ...(byFile[href] || {}), desc,
      title: byFile[href]?.title || clean(card.querySelector('.card-title')?.text || ''),
      code: byFile[href]?.code || clean(card.querySelector('.card-code')?.text || '') };
  }
  for (const sec of root.querySelectorAll('section.track')) {
    const id = clean(sec.querySelector('.track-id')?.text || '');
    const title = clean(sec.querySelector('.track-title')?.text || '');
    const desc = clean(sec.querySelector('.track-desc')?.text || '');
    const mods = [];
    for (const card of sec.querySelectorAll('.card')) {
      const code = clean(card.querySelector('.card-code')?.text || '');
      const href = card.getAttribute('href') || '';
      const file = href.replace(/\.html$/, '');
      mods.push({
        code, file: file || null,
        title: clean(card.querySelector('.card-title')?.text || ''),
        desc: clean(card.querySelector('.card-desc')?.text || ''),
        planned: (card.getAttribute('class') || '').includes('planned'),
      });
    }
    tracks.push({ id, title, desc, mods });
  }
  return { byFile, tracks, courseLos: extractCourseLos(idx) };
}

function extractCourseLos(idx) {
  const root = parse(idx);
  return root.querySelectorAll('.course-lo-list li').map(li => {
    const spans = li.querySelectorAll('span');
    return clean((spans[spans.length - 1] || li).text);
  });
}

// ─── build one deck ────────────────────────────────────────────────────────
function buildDeck(deck, meta) {
  const file = path.join(ROOT, `${deck}.html`);
  if (!existsSync(file)) { console.warn(`skip ${deck}: no ${deck}.html`); return null; }
  const html = readFileSync(file, 'utf8');
  const root = parse(html, { blockTextElements: { script: true, style: true } });

  const titleRaw = clean(root.querySelector('title')?.text || deck);
  const title = titleRaw.split(/\s+[—-]\s+/)[0];

  const card = meta.byFile[deck] || {};
  const objectives = loadDeckGlobal(html, 'DECK_OBJECTIVES') || card.los || [];
  const assessments = loadDeckGlobal(html, 'DECK_ASSESSMENTS') || [];
  const narration = loadNarration(deck);

  const slides = root.querySelectorAll('.slide');
  const sections = [];
  let quizzes = 0;

  slides.forEach((sl, i) => {
    const scls = sl.getAttribute('class') || '';
    if (scls.includes('quiz-slide')) { quizzes++; return; }

    const heading = sl.querySelector('h1, h2');
    const isDivider = scls.includes('section-header') || scls.includes('part-slide');
    let hTxt = clean(heading?.text || '') || (isDivider ? 'Section' : `Slide ${i + 1}`);
    // fold a "Part N" pill / number into the divider heading
    if (isDivider) {
      const pill = clean(sl.querySelector('.pill, .part-num')?.text || '');
      if (pill && !new RegExp(pill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i').test(hTxt)) {
        hTxt = /^\d+$/.test(pill) ? `Part ${pill}: ${hTxt}` : `${pill}: ${hTxt}`;
      }
    }
    const id = slug(hTxt) || `slide-${i + 1}`;

    const ctx = { gotHeading: false, isFirst: i === 0 };
    let bodyHtml = renderChildren(sl, ctx);

    let narr = '';
    if (narration && narration[i]) narr = `<p class="narration">${esc(narration[i])}</p>`;

    const html = (narr + '\n' + bodyHtml).trim();
    // drop slides with no content of their own: dividers, and a bare title slide
    // (its heading + tagline already live in the page <header>)
    if (!html && (isDivider || i === 0)) return;
    if (!html) console.warn(`  ${deck}: slide ${i + 1} "${hTxt}" produced no content`);
    sections.push({ id, heading: hTxt, isDivider, html });
  });

  // de-dup ids
  const seen = {};
  for (const s of sections) {
    if (seen[s.id]) s.id = `${s.id}-${seen[s.id]++}`; else seen[s.id] = 1;
  }

  const kick = card.code
    ? `${card.code} &middot; ${trackName(card.code, meta)}`
    : 'Course module';

  const toc = sections.map(s =>
    `    <li><a href="#${s.id}">${esc(s.heading)}</a></li>`).join('\n');

  const objList = objectives.length
    ? `<section id="objectives" aria-labelledby="objectives-h">
  <h2 id="objectives-h">What you'll be able to do</h2>
  <p>By the end of this module you will be able to:</p>
  <ul>
${objectives.map(o => `    <li>${esc(clean(o))}</li>`).join('\n')}
  </ul>
</section>` : '';

  const secHtml = sections.map(s =>
    `\n<section id="${s.id}" aria-labelledby="${s.id}-h">\n  <h2 id="${s.id}-h">${esc(s.heading)}</h2>\n${s.html}\n</section>`
  ).join('\n');

  const quizNote = quizzes
    ? `<p class="checkpoint">This deck has ${quizzes} checkpoint ${quizzes === 1 ? 'quiz' : 'quizzes'}. The questions are interactive and randomised &mdash; take them in the <a href="../${deck}.html">interactive deck</a>.</p>`
    : '';

  const tasks = assessments.length
    ? `<section id="practical" aria-labelledby="practical-h">
  <h2 id="practical-h">Practical work</h2>
  <dl class="tasks">
${assessments.map(a => {
      const crit = (a.criteria || []).length
        ? `\n      <ul>${a.criteria.map(c => `<li>${esc(clean(c))}</li>`).join('')}</ul>` : '';
      return `    <div><dt>${esc(clean(a.title || ''))}${a.type ? ` <span style="font-weight:400;color:var(--muted)">(${esc(a.type)})</span>` : ''}</dt><dd>${esc(clean(a.desc || ''))}${crit}</dd></div>`;
    }).join('\n')}
  </dl>
</section>` : '';

  const body = `
<header class="doc">
  <p class="kicker">${kick}</p>
  <h1>${esc(title)}</h1>
  ${card.desc ? `<p class="lede">${esc(card.desc)}</p>` : ''}
</header>

<div class="note">
  <span class="note-label">Accessible text version</span>
  <p>This is the plain, linear text version of an interactive slide deck: no slideshow controls, no scripted animation. It responds normally to browser zoom and to screen readers.</p>
  <p><a href="../${deck}.html">Open the interactive deck</a> &nbsp;&middot;&nbsp; <a href="./">All accessible versions</a> &nbsp;&middot;&nbsp; <a href="../index.html">Course home</a></p>
</div>

<nav class="toc" aria-label="Sections">
  <h2>On this page</h2>
  <ol>
${toc}
  </ol>
</nav>

<main id="main">
${objList}
${secHtml}
${quizNote}
${tasks}
</main>

<footer class="doc">
  <p><a href="../index.html">&larr; Course home</a> &nbsp;&middot;&nbsp; Built with AI Assistance &nbsp;&middot;&nbsp; Maynooth University &nbsp;&middot;&nbsp; CC BY 4.0</p>
</footer>`;

  const out = page({ title: `${title} — accessible text version — Learning Web Development by Building with AI`, body });
  const dest = path.join(ROOT, 'accessible', `${deck}.html`);
  writeFileSync(dest, out);
  return dest;
}

function trackName(code, meta) {
  const letter = code[0];
  const t = meta.tracks.find(tr => (tr.id || '').replace(/track\s*/i, '').trim().toUpperCase() === letter);
  return t ? t.title : 'Course module';
}

// ─── build accessible course home ──────────────────────────────────────────
function buildHome(meta, generatedDecks) {
  const gen = new Set(generatedDecks);
  const trackSecs = meta.tracks.map(tr => {
    const mods = tr.mods.map(m => {
      const info = meta.byFile[m.file] || {};
      const los = info.los || [];
      const links = [];
      if (!m.planned && m.file) links.push(`<a href="../${m.file}.html">Open the ${esc(m.title)} deck</a>`);
      if (m.file && gen.has(m.file)) links.push(`<a href="${m.file}.html">Accessible text version</a>`);
      return `  <div class="module${m.planned ? ' planned' : ''}">
    <h3>${esc(m.code)} &mdash; ${esc(m.title)}${m.planned ? ' <span class="tag">Planned</span>' : ''}</h3>
    <p class="desc">${esc(m.desc)}</p>${los.length ? `
    <p class="lo-lead">By the end you will be able to:</p>
    <ul>
${los.map(l => `      <li>${esc(clean(l))}</li>`).join('\n')}
    </ul>` : ''}
    <p class="links">${links.length ? links.join(' &nbsp;&middot;&nbsp; ') : 'Not yet available.'}</p>
  </div>`;
    }).join('\n');
    return `\n<section id="${slug(tr.title)}" aria-labelledby="${slug(tr.title)}-h">
  <h2 id="${slug(tr.title)}-h">${esc(tr.title)}</h2>
  <p>${esc(tr.desc)}</p>
${mods}
</section>`;
  }).join('\n');

  const toc = meta.tracks.map(tr => `    <li><a href="#${slug(tr.title)}">${esc(tr.title)}</a></li>`).join('\n');
  const courseLos = meta.courseLos.map(l => `    <li>${esc(clean(l))}</li>`).join('\n');

  const body = `
<header class="doc">
  <p class="kicker">Course outline &middot; accessible text version</p>
  <h1>Learning Web Development by Building with AI</h1>
  <p class="lede">A practical course in full-stack web development. Build real things, read what the AI wrote, understand every line.</p>
</header>

<div class="note">
  <span class="note-label">Accessible text version</span>
  <p>This is the plain text version of the course home page. It lists every module in reading order, with what you will be able to do after each one, as a single linear page: no interactive widgets, and it responds normally to browser zoom and to screen readers.</p>
  <p><a href="../index.html">Open the interactive course home</a> &nbsp;&middot;&nbsp; <a href="../setup-guide.html">Setup guide</a> &nbsp;&middot;&nbsp; <a href="../resources.html">Resources</a></p>
</div>

<nav class="toc" aria-label="Sections">
  <h2>On this page</h2>
  <ol>
    <li><a href="#about">How this course works</a></li>
    <li><a href="#outcomes">Course learning outcomes</a></li>
${toc}
  </ol>
</nav>

<main id="main">

<section id="about" aria-labelledby="about-h">
  <h2 id="about-h">How this course works</h2>
  <p>This course pairs hands-on building with deliberate reflection. At every step you use AI to generate code, then you read it, question it, and understand it. The goal is not to produce software faster. It is to become the developer who can evaluate, fix, and extend what AI produces. Every module ends with a prompt-reflection exercise.</p>
  <p>Each module is an interactive slide deck with checkpoint quizzes, per-slide notes, optional narrated audio, and practical tasks; progress is saved in your browser. Every deck also supports adjustable text size, full keyboard control, light and dark themes, screen-reader slide announcements, and honours a reduced-motion preference. Modules with their own accessible text version are linked below.</p>
</section>

<section id="outcomes" aria-labelledby="outcomes-h">
  <h2 id="outcomes-h">Course learning outcomes</h2>
  <p>By the end of this course you will be able to:</p>
  <ol>
${courseLos}
  </ol>
</section>
${trackSecs}

<section id="dependencies" aria-labelledby="dependencies-h">
  <h2 id="dependencies-h">Track dependencies</h2>
  <ul>
    <li>Track A (Foundations) comes first.</li>
    <li>Track B (Backend API) builds on Track A.</li>
    <li>Track C (Frontend) builds on Track A.</li>
    <li>Track D (Fullstack) requires both Track B and Track C.</li>
    <li>Track E (AI Agents &amp; Automation) builds on Track A.</li>
  </ul>
</section>

</main>

<footer class="doc">
  <p><a href="../index.html">&larr; Course home</a> &nbsp;&middot;&nbsp; Built with AI Assistance &nbsp;&middot;&nbsp; Maynooth University &nbsp;&middot;&nbsp; CC BY 4.0</p>
</footer>`;

  const extraCss = `
  h3 { font-size:1.1rem; margin:1.75rem 0 .35rem; }
  .module { border:1px solid var(--rule); background:var(--card-bg); border-radius:6px; padding:1rem 1.2rem; margin:1rem 0; }
  .module h3 { margin-top:0; }
  .module .desc { color:var(--muted); margin:.35rem 0 .6rem; }
  .module .lo-lead { font-weight:600; font-size:.95rem; margin:.6rem 0 .2rem; }
  .module ul { margin:.2rem 0; }
  .module .links { margin-top:.7rem; font-size:.95rem; }
  .module.planned { opacity:.75; }
  .tag { display:inline-block; font-size:.75rem; font-weight:700; text-transform:uppercase; letter-spacing:.05em; border:1px solid var(--rule); border-radius:3px; padding:.05rem .4rem; margin-left:.4rem; color:var(--muted); vertical-align:middle; }`;

  const out = page({ title: 'Course outline — accessible text version — Learning Web Development by Building with AI', body })
    .replace('</style>', extraCss + '\n</style>');
  writeFileSync(path.join(ROOT, 'accessible', 'index.html'), out);
}

// ─── update the ACCESSIBLE_VERSIONS manifest in index.html ─────────────────
function updateManifest(decks) {
  const p = path.join(ROOT, 'index.html');
  let html = readFileSync(p, 'utf8');
  const entries = decks.map(d => `  '${d}': 'accessible/${d}.html'`).join(',\n');
  const block = `var ACCESSIBLE_VERSIONS = {\n${entries}\n};`;
  const re = /var ACCESSIBLE_VERSIONS = \{[\s\S]*?\};/;
  if (re.test(html)) {
    html = html.replace(re, block);
    writeFileSync(p, html);
    console.log(`manifest: ${decks.length} entries`);
  } else {
    console.warn('manifest: ACCESSIBLE_VERSIONS block not found in index.html');
  }
}

// ─── main ──────────────────────────────────────────────────────────────────
const meta = loadCourseMeta();

if (DO_HOME && !DO_ALL) {
  const existing = readdirSync(path.join(ROOT, 'accessible'))
    .filter(f => f.endsWith('.html') && f !== 'index.html').map(f => f.replace(/\.html$/, ''));
  buildHome(meta, existing);
  console.log('rebuilt accessible/index.html');
} else if (DO_ALL) {
  const decks = readdirSync(ROOT)
    .filter(f => /(-workshop|^start-here)\.html$/.test(f))
    .map(f => f.replace(/\.html$/, ''))
    .sort();
  const built = [];
  for (const d of decks) {
    const dest = buildDeck(d, meta);
    if (dest) { built.push(d); console.log(`built accessible/${d}.html`); }
  }
  updateManifest(built);
  buildHome(meta, built);
  console.log(`\ndone: ${built.length} decks + course home`);
} else if (ONE) {
  const deck = ONE.replace(/\.html$/, '');
  const dest = buildDeck(deck, meta);
  console.log(dest ? `built ${path.relative(ROOT, dest)}` : 'nothing built');
} else {
  console.error('Usage: build-accessible.mjs <deck> | --all | --home');
  process.exit(1);
}
