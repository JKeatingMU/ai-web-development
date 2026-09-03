#!/usr/bin/env node
/**
 * build-deck.mjs — compile a course deck from Markdown.
 *
 *   node server/tools/build-deck.mjs decks/c6-testing.md
 *   node server/tools/build-deck.mjs examples/tea/decks/*.md
 *
 * Writes <slug>.html one directory above the .md (alongside deck-extras.js),
 * e.g.  decks/c6-testing.md -> c6-testing.html
 *       examples/tea/decks/t1.md -> examples/tea/t1.html
 *
 * Format: YAML frontmatter + a body of `## ` slides.  See docs/authoring.md.
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';
import { load as yamlLoad } from 'js-yaml';
import MarkdownIt from 'markdown-it';
import container from 'markdown-it-container';
import { parse as parseHtml } from 'node-html-parser';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const inputs = process.argv.slice(2).filter(a => !a.startsWith('--'));
if (!inputs.length) { console.error('usage: build-deck.mjs <deck.md> [more.md ...]'); process.exit(1); }

// ─── markdown-it ───────────────────────────────────────────────────────────
const md = new MarkdownIt({ html: true, linkify: true, typographer: true });

// fenced code -> deck .terminal block
md.renderer.rules.fence = (tokens, i) => {
  const t = tokens[i];
  const info = (t.info || '').trim();
  const label = info.replace(/^\S+\s+/, '') || info || 'code';
  const body = esc(t.content.replace(/\n$/, ''));
  return `<div class="terminal">
  <div class="terminal-bar"><span class="dot dot-red"></span><span class="dot dot-yellow"></span><span class="dot dot-green"></span><span class="terminal-label">${esc(label)}</span></div>
  <div class="terminal-body">${body}</div>
</div>\n`;
};

// blockquote -> deck .callout, leader word picks the flavour
const LEADERS = {
  'key concept': ['callout-blue', 'icon-key'], 'key': ['callout-blue', 'icon-key'],
  'tip': ['callout-blue', 'icon-tip'],
  'gotcha': ['callout-orange', 'icon-gotcha'], 'warning': ['callout-orange', 'icon-gotcha'],
  'hands-on': ['callout-green', 'icon-hands-on'], 'try it': ['callout-green', 'icon-hands-on'],
  'note': ['callout-purple', ''],
};
const origBqOpen = md.renderer.rules.blockquote_open || ((t, i, o, e, s) => s.renderToken(t, i, o));

// ::: cols  ~~~  :::   and   ::: prompt Label  :::
md.use(container, 'cols', {
  render: (tokens, i) => tokens[i].nesting === 1 ? '<div class="cols">\n<div>' : '</div>\n</div>\n',
});
md.use(container, 'prompt', {
  validate: p => /^prompt\b/.test(p.trim()),
  render: (tokens, i) => {
    if (tokens[i].nesting === 1) {
      const label = tokens[i].info.trim().replace(/^prompt\s*/, '') || 'Prompt';
      return `<div class="prompt-block">\n  <div class="prompt-bar"><span>✦</span> ${esc(label)}</div>\n  <div class="prompt-body">\n`;
    }
    return '  </div>\n</div>\n';
  },
});

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const attrsOf = s => {
  const o = {}; const m = (s || '').match(/\{([^}]*)\}\s*$/);
  if (m) for (const tok of m[1].trim().split(/\s+/)) {
    if (tok.includes('=')) { const [k, v] = tok.split('='); o[k] = v; }
    else o[tok] = true;
  }
  return o;
};
const stripAttrs = s => s.replace(/\s*\{[^}]*\}\s*$/, '').trim();
// a lone `+++` column separator must be its own paragraph
const normalize = s => s.replace(/(^|\n)[ \t]*\+{3}[ \t]*(?=\n|$)/g, '\n\n+++\n\n');

// post-process one slide's rendered HTML into deck markup
function deckify(html) {
  const root = parseHtml(html, { blockTextElements: { script: true, style: true } });
  // blockquote -> callout
  for (const bq of root.querySelectorAll('blockquote')) {
    const firstP = bq.querySelector('p');
    let cls = 'callout callout-blue';
    if (firstP) {
      const strong = firstP.querySelector('strong');
      const lead = strong ? strong.text.trim().toLowerCase() : '';
      if (LEADERS[lead]) {
        const [colour, icon] = LEADERS[lead];
        cls = `callout ${colour}${icon ? ' ' + icon : ''}`;
        strong.remove();
        firstP.set_content(firstP.innerHTML.replace(/^\s*[—:-]\s*/, '').trim());
      }
    }
    const div = parseHtml(`<div class="${cls}">${bq.innerHTML}</div>`).firstChild;
    bq.replaceWith(div);
  }
  // split ::: cols on a `+++` separator paragraph into one <div> per column
  for (const cols of root.querySelectorAll('.cols > div')) {
    const parts = cols.innerHTML.split(/<p>\+{3}<\/p>/);
    if (parts.length > 1) {
      cols.replaceWith(parseHtml(parts.map(p => `<div>${p}</div>`).join('')));
    }
  }
  return root.toString();
}

// ─── deck skeleton ─────────────────────────────────────────────────────────
const CSS = accent => `
  :root {
    --bg:#0f1117; --slide-bg:#161b22; --border:#30363d; --text:#e6edf3; --muted:#8b949e;
    --accent:${accent}; --green:#3fb950; --yellow:#d29922; --red:#f85149; --purple:#bc8cff; --orange:#ffa657;
    --term-bg:#010409; --term-text:#c9d1d9; --highlight:#1f6feb; --prompt-border:#388bfd;
  }
  *{box-sizing:border-box;margin:0;padding:0;}
  body{background:var(--bg);color:var(--text);font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',system-ui,sans-serif;height:100vh;overflow:hidden;display:flex;flex-direction:column;align-items:center;justify-content:center;}
  .slide{position:absolute;inset:0;display:none;padding:50px 70px;flex-direction:column;justify-content:center;background:var(--slide-bg);border:1px solid var(--border);margin:20px;width:calc(100% - 40px);height:calc(100% - 40px);border-radius:12px;overflow:hidden;}
  .slide.active{display:flex;}
  .slide-label{font-size:11px;text-transform:uppercase;letter-spacing:2px;color:var(--muted);margin-bottom:10px;font-weight:600;}
  h1{font-size:40px;font-weight:700;line-height:1.15;margin-bottom:14px;}
  h1 .accent{color:var(--accent);}
  h2{font-size:29px;font-weight:700;margin-bottom:8px;line-height:1.2;}
  h3{font-size:18px;font-weight:700;margin:8px 0 4px;}
  .subtitle{font-size:19px;color:var(--muted);line-height:1.5;margin-bottom:26px;max-width:700px;}
  p{font-size:15px;color:var(--muted);line-height:1.7;margin:10px 0;}
  li{font-size:15px;color:var(--muted);line-height:1.7;margin:4px 0;}
  ul,ol{margin:8px 0 8px 22px;}
  strong{color:var(--text);font-weight:600;}
  em{color:var(--text);font-style:italic;}
  a{color:var(--accent);}
  code{font-family:'SF Mono','Fira Code',monospace;font-size:12px;background:rgba(110,118,129,.12);padding:2px 5px;border-radius:4px;color:var(--orange);}
  .part-slide{justify-content:center;align-items:flex-start;}
  .part-num{font-size:64px;font-weight:800;color:var(--accent);opacity:.5;line-height:1;margin-bottom:6px;}
  .section-header{justify-content:center;align-items:center;text-align:center;}
  .terminal{background:var(--term-bg);border:1px solid var(--border);border-radius:8px;overflow:hidden;margin:12px 0;flex-shrink:0;}
  .terminal-bar{background:#21262d;padding:7px 14px;display:flex;align-items:center;gap:8px;border-bottom:1px solid var(--border);}
  .dot{width:11px;height:11px;border-radius:50%;} .dot-red{background:#f85149;} .dot-yellow{background:#d29922;} .dot-green{background:#3fb950;}
  .terminal-label{font-size:12px;color:var(--muted);margin-left:8px;font-family:'SF Mono',monospace;}
  .terminal-body{padding:15px 20px;font-family:'SF Mono','Fira Code',monospace;font-size:13px;line-height:1.7;color:var(--term-text);overflow:auto;max-height:min(55vh,400px);white-space:pre-wrap;}
  .callout{border-radius:8px;padding:14px 18px;font-size:14px;line-height:1.7;border-left-width:3px;border-left-style:solid;margin:6px 0;}
  .callout p{color:var(--text);margin:4px 0;} .callout p:first-child{margin-top:0;} .callout p:last-child{margin-bottom:0;}
  .callout ul,.callout ol{margin:4px 0 4px 20px;} .callout li{color:var(--text);}
  .callout-blue{background:rgba(88,166,255,.07);border-color:var(--accent);}
  .callout-green{background:rgba(63,185,80,.07);border-color:var(--green);}
  .callout-yellow{background:rgba(210,153,34,.07);border-color:var(--yellow);}
  .callout-orange{background:rgba(255,166,87,.07);border-color:var(--orange);}
  .callout-purple{background:rgba(188,140,255,.07);border-color:var(--purple);}
  .cols{display:flex;gap:20px;align-items:stretch;margin:8px 0;} .cols>div{flex:1;min-width:0;}
  table{width:100%;border-collapse:collapse;font-size:13px;margin:10px 0;}
  th{text-align:left;padding:8px 12px;background:rgba(255,255,255,.04);color:var(--text);font-weight:600;border-bottom:1px solid var(--border);}
  td{padding:8px 12px;color:var(--muted);border-bottom:1px solid rgba(48,54,61,.6);vertical-align:top;}
  .prompt-block{background:rgba(56,139,253,.06);border:1px solid var(--prompt-border);border-radius:8px;overflow:hidden;margin:10px 0;flex-shrink:0;}
  .prompt-bar{background:rgba(88,166,255,.1);padding:7px 16px;font-size:12px;color:var(--accent);font-weight:600;letter-spacing:.5px;}
  .prompt-body{padding:14px 18px;font-size:13px;line-height:1.8;color:var(--text);} .prompt-body p{color:var(--text);}
  #nav{position:fixed;bottom:28px;right:38px;display:flex;align-items:center;gap:10px;z-index:100;}
  #counter{font-size:12px;color:var(--muted);font-family:monospace;}
  .nav-btn{background:var(--slide-bg);border:1px solid var(--border);color:var(--text);width:34px;height:34px;border-radius:8px;cursor:pointer;font-size:16px;display:flex;align-items:center;justify-content:center;}
  #progress{position:fixed;bottom:0;left:0;height:3px;background:var(--accent);transition:width .3s ease;z-index:100;}
  #hint{position:fixed;top:18px;right:38px;font-size:11px;color:var(--muted);font-family:monospace;}
  #app-link{position:fixed;bottom:28px;left:38px;font-size:11px;font-family:'SF Mono',monospace;color:var(--muted);text-decoration:none;background:rgba(22,27,34,.9);border:1px solid var(--border);padding:4px 10px;border-radius:6px;z-index:200;}
  #index-link{position:fixed;bottom:28px;left:50%;transform:translateX(-50%);font-size:11px;font-family:'SF Mono',monospace;color:var(--muted);text-decoration:none;background:rgba(22,27,34,.9);border:1px solid var(--border);padding:4px 10px;border-radius:6px;z-index:200;}`;

const NAV = `
  const slides = document.querySelectorAll('.slide');
  const total = slides.length;
  let current = 0;
  function show(n) {
    if (n < 0 || n >= total) return;
    slides[current].classList.remove('active');
    current = n;
    slides[current].classList.add('active');
    document.getElementById('counter').textContent = (current + 1) + ' / ' + total;
    document.getElementById('progress').style.width = ((current + 1) / total * 100) + '%';
  }
  window.deckShow = show;
  document.getElementById('next').addEventListener('click', () => show(current + 1));
  document.getElementById('prev').addEventListener('click', () => show(current - 1));
  document.addEventListener('keydown', e => {
    const tag = document.activeElement && document.activeElement.tagName;
    if (tag === 'TEXTAREA' || tag === 'INPUT') return;
    if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); show(current + 1); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); show(current - 1); }
    if (e.key === 'f' || e.key === 'F') {
      if (!document.fullscreenElement) document.documentElement.requestFullscreen();
      else document.exitFullscreen();
    }
  });
  show(0);`;

// ─── compile one deck ──────────────────────────────────────────────────────
function compile(mdPath) {
  const src = readFileSync(mdPath, 'utf8');
  const fm = src.match(/^---\n([\s\S]*?)\n---\n?/);
  if (!fm) throw new Error(`${mdPath}: missing YAML frontmatter`);
  const meta = yamlLoad(fm[1]) || {};
  const body = src.slice(fm[0].length).trim();

  for (const k of ['code', 'title', 'slug']) if (!meta[k]) throw new Error(`${mdPath}: frontmatter needs "${k}"`);
  const accent = meta.accent || '#58a6ff';
  const trackLabel = meta.track_label || (meta.track ? (meta.track.length === 1 ? `Track ${meta.track}` : meta.track) : 'Course');
  const label = `${trackLabel}${meta.module ? ' · Module ' + meta.module : ''}`;

  // split body into slides on lines starting `## `
  const chunks = body.split(/\n(?=## )/);
  const slides = [];

  // title slide
  const tags = (meta.tags || []).map(t => `<span class="badge badge-blue">${esc(t)}</span>`).join(' ');
  slides.push(`<div class="slide active">
  <div class="slide-label">${esc(label)}</div>
  <h1>${esc(meta.title)}</h1>
  ${meta.subtitle ? `<div class="subtitle">${esc(meta.subtitle)}</div>` : ''}
  ${tags ? `<div style="display:flex;gap:10px;margin-bottom:20px;">${tags}</div>` : ''}
  ${meta.intro ? `<div class="callout callout-blue">${md.renderInline(meta.intro)}</div>` : ''}
</div>`);

  for (const chunk of chunks) {
    const m = chunk.match(/^##\s+(.*)/);
    if (!m) continue;
    const a = attrsOf(m[1]);
    const heading = stripAttrs(m[1]);
    const rest = normalize(chunk.replace(/^##\s+.*\n?/, '').trim());

    if (a.quiz) {
      slides.push(`<div class="slide quiz-slide" data-checkpoint="${esc(String(a.quiz === true ? 1 : a.quiz))}" data-pick="3"></div>`);
      continue;
    }

    let cls = 'slide', inner = '';
    if (a.section) {
      cls = 'slide section-header';
      inner = `<div class="slide-label">${esc(label)}</div>\n<h2>${esc(heading)}</h2>\n${rest ? deckify(md.render(rest)) : ''}`;
    } else if (a.part) {
      cls = 'slide part-slide';
      inner = `<div class="part-num">${esc(String(a.part).split('/')[0].padStart(2, '0'))}</div>\n<div class="slide-label">Part ${esc(String(a.part).replace('/', ' of '))}</div>\n<h2>${esc(heading)}</h2>\n${rest ? deckify(md.render(rest)) : ''}`;
    } else if (a.reflect) {
      cls = 'slide';
      inner = `<div class="slide-label">Prompt Reflection</div>\n<h2>${esc(heading)}</h2>\n<div class="callout callout-purple">${deckify(md.render(rest))}</div>`;
    } else {
      inner = `<div class="slide-label">${esc(label)}</div>\n<h2>${esc(heading)}</h2>\n${deckify(md.render(rest))}`;
    }
    slides.push(`<div class="${cls}">\n${inner}\n</div>`);
  }

  // deck-extras path relative to output dir
  const outDir = path.resolve(path.dirname(mdPath), '..');
  const rel = path.relative(outDir, ROOT) || '.';
  const ex = p => (rel === '.' ? '' : rel + '/') + p;

  const questions = [];
  for (const [cp, qs] of Object.entries(meta.quiz || {})) {
    for (const q of qs) questions.push({ checkpoint: +cp, type: q.type || 'mcq', ...q });
  }

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(meta.title)}${meta.course ? ' — ' + esc(meta.course) : ''}</title>
<style>${CSS(accent)}
  .badge{display:inline-block;font-size:11px;font-weight:700;padding:2px 8px;border-radius:4px;font-family:'SF Mono',monospace;}
  .badge-blue{background:rgba(88,166,255,.15);color:var(--accent);border:1px solid rgba(88,166,255,.3);}
</style>
<link rel="stylesheet" href="${ex('deck-extras.css')}">
</head>
<body>

${slides.join('\n\n')}

<a href="${meta.app_link || '#'}" id="app-link">${esc(meta.app_label || 'Course')}</a>
<a href="${meta.index_link || 'index.html'}" id="index-link">⌂ ${esc(meta.course || 'Course')}</a>
<div id="nav">
  <span id="counter">1 / ${slides.length}</span>
  <button class="nav-btn" id="prev">&#8249;</button>
  <button class="nav-btn" id="next">&#8250;</button>
</div>
<div id="progress"></div>
<div id="hint">← → to navigate · F for fullscreen</div>

<script>${NAV}</script>
<script>window.DECK_NAME = ${JSON.stringify(meta.slug)};</script>
<script>window.DECK_OBJECTIVES = ${JSON.stringify(meta.objectives || [], null, 2)};</script>
<script>window.DECK_ASSESSMENTS = ${JSON.stringify(meta.assessments || [], null, 2)};</script>
<script>window.DECK_QUESTIONS = ${JSON.stringify(questions, null, 2)};</script>
<script src="${ex('deck-extras.js')}"></script>
</body>
</html>
`;

  const outPath = path.join(outDir, `${meta.slug}.html`);
  writeFileSync(outPath, html);
  return { outPath, slides: slides.length, meta };
}

// ─── main ──────────────────────────────────────────────────────────────────
for (const inp of inputs) {
  try {
    const r = compile(path.resolve(inp));
    console.log(`built ${path.relative(ROOT, r.outPath)}  (${r.slides} slides)`);
  } catch (e) {
    console.error(`FAILED ${inp}: ${e.message}`);
    process.exitCode = 1;
  }
}
