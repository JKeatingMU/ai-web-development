#!/usr/bin/env node
/**
 * build-outline.mjs
 * outline.md  ->  the generated regions of index.html:
 *   header (title/subtitle/tagline), About, Outcomes, the track sections,
 *   Dependencies, and `var MODULE_LOS`.
 *
 * index.html carries matching markers:
 *   <!-- BUILD:header -->        … <!-- /BUILD:header -->
 *   <!-- BUILD:about -->         … <!-- /BUILD:about -->
 *   <!-- BUILD:outcomes -->      … <!-- /BUILD:outcomes -->
 *   <!-- BUILD:tracks -->        … <!-- /BUILD:tracks -->
 *   <!-- BUILD:dependencies -->  … <!-- /BUILD:dependencies -->
 *   /* BUILD:module-los *\/      … /* /BUILD:module-los *\/
 *
 * Usage:  node server/tools/build-outline.mjs          (writes index.html)
 *         node server/tools/build-outline.mjs --check   (report drift, write nothing)
 *
 * After this, run `npm run build:accessible` to refresh the accessible course home.
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const CHECK = process.argv.includes('--check');

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
// keep **bold** and `code` as inline HTML; escape the rest
const inline = s => esc(s)
  .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
  .replace(/`([^`]+)`/g, '<code>$1</code>');

// ─── parse outline.md ──────────────────────────────────────────────────────
export function parseOutline(mdPath = path.join(ROOT, 'outline.md')) {
  const src = readFileSync(mdPath, 'utf8');
  const fm = src.match(/^---\n([\s\S]*?)\n---\n/);
  const front = {};
  if (fm) for (const line of fm[1].split('\n')) {
    const m = line.match(/^(\w+):\s*(.*)$/);
    if (m) front[m[1]] = m[2].trim();
  }
  const body = fm ? src.slice(fm[0].length) : src;

  const attrs = str => {
    const o = {};
    const m = (str || '').match(/\{([^}]*)\}/);
    if (m) for (const tok of m[1].trim().split(/\s+/)) {
      if (tok.startsWith('#')) o.id = tok.slice(1);
      else if (tok.includes('=')) { const [k, v] = tok.split('='); o[k] = v; }
      else o[tok] = true;
    }
    return o;
  };
  const stripAttrs = s => s.replace(/\s*\{[^}]*\}\s*$/, '').trim();

  const out = { front, about: [], outcomes: [], dependencies: [], tracks: [] };
  let mode = null, track = null, mod = null;

  const flushMod = () => { if (mod) { track.modules.push(mod); mod = null; } };
  const flushTrack = () => { flushMod(); if (track) { out.tracks.push(track); track = null; } };

  for (const raw of body.split('\n')) {
    const line = raw.replace(/\s+$/, '');

    let m;
    if ((m = line.match(/^##\s+(.+)$/))) {
      const heading = stripAttrs(m[1]);
      const a = attrs(m[1]);
      if (/^about$/i.test(heading)) { flushTrack(); mode = 'about'; continue; }
      if (/^outcomes$/i.test(heading)) { flushTrack(); mode = 'outcomes'; continue; }
      if (/^dependencies$/i.test(heading)) { flushTrack(); mode = 'dependencies'; continue; }
      // a track heading:  "Track A — Foundations"  |  "Start Here — Orientation"
      flushTrack();
      mode = 'track';
      const [label, ...rest] = heading.split(/\s+[—-]\s+/);
      const letter = a.id || (/^track\s+(\w)/i.test(label) ? label.match(/^track\s+(\w)/i)[1].toLowerCase() : label.toLowerCase().replace(/[^a-z0-9]+/g, ''));
      track = { label: label.trim(), name: rest.join(' — ').trim(), letter, color: a.color || '#8b949e', desc: '', note: '', modules: [] };
      continue;
    }

    if ((m = line.match(/^###\s+(.+)$/))) {
      flushMod();
      const a = attrs(m[1]);
      const heading = stripAttrs(m[1]);
      const [code, ...rest] = heading.split(/\s+[—-]\s+/);
      mod = { code: code.trim(), title: rest.join(' — ').trim(), file: a.file || null, planned: !!a.planned, desc: '', los: [] };
      continue;
    }

    if (mode === 'about') { if (line.trim()) out.about.push(line); else if (out.about.length && out.about[out.about.length - 1] !== '') out.about.push(''); continue; }
    if (mode === 'outcomes') { if ((m = line.match(/^\d+\.\s+(.+)$/))) out.outcomes.push(m[1].trim()); continue; }
    if (mode === 'dependencies') { if ((m = line.match(/^[-*]\s+(.+)$/))) out.dependencies.push(m[1].trim()); continue; }

    if (mode === 'track') {
      if ((m = line.match(/^>\s?(.*)$/))) { track.note = (track.note ? track.note + ' ' : '') + m[1].trim(); continue; }
      if ((m = line.match(/^[-*]\s+(.+)$/))) { if (mod) mod.los.push(m[1].trim()); continue; }
      if (line.trim()) { if (mod) mod.desc = (mod.desc ? mod.desc + ' ' : '') + line.trim(); else track.desc = (track.desc ? track.desc + ' ' : '') + line.trim(); }
    }
  }
  flushTrack();
  return out;
}

// ─── render the index.html regions ─────────────────────────────────────────
function renderHeader(f) {
  const t = esc(f.title || 'Course');
  const accent = f.title_accent ? ` <span>${esc(f.title_accent)}</span>` : '';
  return `    <h1>${t}${accent}</h1>\n` +
    (f.subtitle ? `    <p class="subtitle">${esc(f.subtitle)}</p>\n` : '') +
    (f.tagline ? `    <p class="tagline">${esc(f.tagline)}</p>\n` : '') + '  ';
}

function renderAbout(paras) {
  const chunks = paras.join('\n').split(/\n\s*\n/).map(s => s.trim()).filter(Boolean);
  let html = '\n  <div class="philosophy">\n';
  chunks.forEach((c, i) => {
    const style = i === 0 ? '' : ' style="margin-top:10px;font-size:13px;color:var(--muted);"';
    html += `    <p${style}>${inline(c).replace(/<strong>/g, '<strong style="color:var(--text);">')}</p>\n`;
  });
  return html + '  </div>\n  ';
}

function renderOutcomes(list) {
  const trackCount = 5;
  let html = `\n  <div class="course-los" id="course-los">
    <button class="course-los-toggle" onclick="document.getElementById('course-los').classList.toggle('open')">
      <span><span class="course-los-arrow">&#9654;</span> Course Learning Outcomes</span>
      <span style="font-size:12px;color:var(--muted);font-weight:400;">${list.length} outcomes across ${trackCount} tracks</span>
    </button>
    <div class="course-los-body">
      <p class="course-los-intro">By the end of this course, you will be able to:</p>
      <ol class="course-lo-list">\n`;
  list.forEach((o, i) => {
    html += `        <li><span class="course-lo-num">${String(i + 1).padStart(2, '0')}</span><span>${inline(o)}</span></li>\n`;
  });
  return html + '      </ol>\n    </div>\n  </div>\n  ';
}

function renderDependencies(lines) {
  const chain = str => str.split(/\s+(→|and)\s+/).map(tok => {
    if (tok === '→') return '      <span class="dep-arrow">&#8594;</span>';
    if (tok === 'and') return '      <span class="dep-arrow">and</span>';
    const t = tok.replace(/\*\*/g, '').trim();
    const letter = t[0].toLowerCase();
    return `      <span class="dep-pill dep-${letter}">${esc(t).replace(/—/g, '&mdash;')}</span>`;
  }).join('\n');
  let html = '\n  <div class="dep-note">\n    <strong>Track dependencies</strong>\n';
  for (const l of lines) html += `    <div class="dep-chain">\n${chain(l)}\n    </div>\n`;
  return html + '  </div>\n  ';
}

function cardClass(letter) { return letter === 'start' || letter.length > 1 ? 'card-start' : `card-${letter}`; }
function trackClass(letter) { return letter === 'start' || letter.length > 1 ? 'track-start' : `track-${letter}`; }

function renderTracks(tracks) {
  let html = '\n';
  for (const tr of tracks) {
    const isStart = trackClass(tr.letter) === 'track-start';
    const secStyle = isStart ? ' style="margin-bottom:32px;"' : '';
    const rgb = hexToRgb(tr.color);
    const hdrStyle = isStart ? ` style="background:rgba(${rgb},.08);border-color:rgba(${rgb},.3);"` : '';
    const span = isStart ? ` style="color:${tr.color};"` : '';
    html += `\n  <section class="track ${trackClass(tr.letter)}"${secStyle}>\n`;
    html += `    <div class="track-header"${hdrStyle}>\n`;
    html += `      <span class="track-id"${span}>${esc(tr.label)}</span>\n`;
    html += `      <span class="track-title"${span}>${esc(tr.name)}</span>\n`;
    html += `      <span class="track-desc">${esc(tr.desc)}</span>\n`;
    html += `    </div>\n`;
    if (tr.note) html += `    <div class="track-note">Note: ${inline(tr.note)}</div>\n`;
    html += `    <div class="card-row">\n`;
    for (const mo of tr.modules) {
      const codeStyle = isStart ? ` style="color:${tr.color};"` : '';
      if (mo.planned) {
        html += `      <div class="card planned ${cardClass(tr.letter)}">\n`;
        html += `        <span class="card-badge">&#9675; Planned</span>\n`;
        html += `        <div class="card-code"${codeStyle}>${esc(mo.code)}</div>\n`;
        html += `        <div class="card-title">${esc(mo.title)}</div>\n`;
        html += `        <div class="card-desc">${esc(mo.desc)}</div>\n`;
        html += `      </div>\n`;
      } else {
        html += `      <a href="${esc(mo.file)}.html" class="card available ${cardClass(tr.letter)}">\n`;
        html += `        <div class="card-code"${codeStyle}>${esc(mo.code)}</div>\n`;
        html += `        <div class="card-title">${esc(mo.title)}</div>\n`;
        html += `        <div class="card-desc">${esc(mo.desc)}</div>\n`;
        html += `        <div class="card-reflect">${isStart ? '' : 'Includes prompt reflection'}</div>\n`;
        html += `      </a>\n`;
      }
    }
    html += `    </div>\n  </section>\n`;
  }
  return html + '  ';
}

function renderModuleLos(tracks) {
  let js = '\nvar MODULE_LOS = {\n';
  const rows = [];
  for (const tr of tracks) for (const mo of tr.modules) {
    if (mo.planned) continue;
    const los = mo.los.map(l => `    ${JSON.stringify(l)}`).join(',\n');
    rows.push(`  ${JSON.stringify(mo.code)}: { title: ${JSON.stringify(mo.title)}, color: ${JSON.stringify(tr.color)}, file: ${JSON.stringify(mo.file)}, los: [\n${los}\n  ]}`);
  }
  return js + rows.join(',\n') + '\n};\n';
}

function hexToRgb(hex) {
  const h = hex.replace('#', '');
  return [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16)).join(',');
}

// ─── splice into index.html ────────────────────────────────────────────────
function splice(html, name, replacement, comment = true) {
  const [open, close] = comment
    ? [`<!-- BUILD:${name} `, `<!-- /BUILD:${name} -->`]
    : [`/* BUILD:${name} `, `/* /BUILD:${name} */`];
  const oi = html.indexOf(open);
  if (oi < 0) throw new Error(`marker BUILD:${name} not found in index.html`);
  const os = html.indexOf(comment ? '-->' : '*/', oi) + (comment ? 3 : 2);
  const ci = html.indexOf(close, os);
  if (ci < 0) throw new Error(`marker /BUILD:${name} not found`);
  return { text: html.slice(0, os) + '\n' + replacement + html.slice(ci), changed: html.slice(os, ci) !== '\n' + replacement };
}

// ─── main ──────────────────────────────────────────────────────────────────
const o = parseOutline();
const idxPath = path.join(ROOT, 'index.html');
let html = readFileSync(idxPath, 'utf8');
let anyChange = false;

for (const [name, rep, isComment] of [
  ['header', renderHeader(o.front), true],
  ['about', renderAbout(o.about), true],
  ['outcomes', renderOutcomes(o.outcomes), true],
  ['tracks', renderTracks(o.tracks), true],
  ['dependencies', renderDependencies(o.dependencies), true],
  ['module-los', renderModuleLos(o.tracks), false],
]) {
  const r = splice(html, name, rep, isComment);
  html = r.text;
  if (r.changed) { anyChange = true; if (CHECK) console.log(`drift: BUILD:${name}`); }
}

// warn about missing deck files
for (const tr of o.tracks) for (const mo of tr.modules) {
  if (!mo.planned && !existsSync(path.join(ROOT, `${mo.file}.html`))) {
    console.warn(`  warning: ${mo.code} points at ${mo.file}.html which does not exist`);
  }
}

if (CHECK) {
  console.log(anyChange ? 'index.html is out of date — run `npm run build:outline`' : 'index.html is in sync with outline.md');
  process.exit(anyChange ? 1 : 0);
}
writeFileSync(idxPath, html);
console.log(`index.html updated from outline.md — ${o.tracks.length} tracks, ` +
  `${o.tracks.reduce((n, t) => n + t.modules.length, 0)} modules` +
  (anyChange ? '' : ' (no change)'));
