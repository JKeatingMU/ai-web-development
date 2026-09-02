#!/usr/bin/env node
/**
 * generate-deck-scripts.mjs
 * Generates voiceover scripts (and optionally TTS audio) for a slide deck.
 *
 * Usage:
 *   node tools/generate-deck-scripts.mjs ../docs/web-fundamentals-workshop.html
 *   node tools/generate-deck-scripts.mjs ../docs/web-fundamentals-workshop.html --audio
 *   node tools/generate-deck-scripts.mjs ../docs/web-fundamentals-workshop.html --audio --voice nova --hd
 *
 * Flags:
 *   --audio          Also generate per-slide MP3s via OpenAI TTS
 *   --voice <name>   TTS voice: alloy | echo | fable | nova | onyx | shimmer (default: nova)
 *   --hd             Use tts-1-hd model (higher quality, slower, ~2× cost)
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { parse } from 'node-html-parser';
import path from 'path';
import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';

const args = process.argv.slice(2);
const inputFile = args.find(a => !a.startsWith('--'));
if (!inputFile) {
  console.error('Usage: node tools/generate-deck-scripts.mjs <path-to-deck.html> [--audio] [--voice nova] [--hd]');
  process.exit(1);
}

const doAudio  = args.includes('--audio');
const useHD    = args.includes('--hd');
const voiceIdx = args.indexOf('--voice');
const ttsVoice = voiceIdx >= 0 ? args[voiceIdx + 1] : 'nova';
const ttsModel = useHD ? 'tts-1-hd' : 'tts-1';

const useAnthropic = !!process.env.ANTHROPIC_API_KEY;
const useOpenAI    = !!process.env.OPENAI_API_KEY;
if (!useAnthropic && !useOpenAI) {
  console.error('Error: set ANTHROPIC_API_KEY or OPENAI_API_KEY');
  process.exit(1);
}
if (doAudio && !useOpenAI) {
  console.error('Error: --audio requires OPENAI_API_KEY (OpenAI TTS)');
  process.exit(1);
}
const provider  = useAnthropic ? 'anthropic' : 'openai';
const modelName = useAnthropic ? 'claude-sonnet-4-6' : 'gpt-4o';
console.log(`Using provider: ${provider} (${modelName})${doAudio ? ` + TTS ${ttsModel}/${ttsVoice}` : ''}`);

const htmlPath = path.resolve(inputFile);
const html = readFileSync(htmlPath, 'utf-8');
const root = parse(html);

// Extract DECK_OBJECTIVES from inline script
let objectives = [];
const scriptTags = root.querySelectorAll('script');
for (const s of scriptTags) {
  const text = s.rawText || s.text || '';
  const match = text.match(/window\.DECK_OBJECTIVES\s*=\s*(\[[\s\S]*?\]);/);
  if (match) {
    try { objectives = JSON.parse(match[1]); } catch {}
    break;
  }
}

// Collect deck title from <title>
const titleEl = root.querySelector('title');
const pageTitle = titleEl ? titleEl.text.split('—')[0].trim() : 'Unknown';

// Collect deck name from filename
const deckName = path.basename(htmlPath, '.html');

// Select all slides, note quiz slides
const allSlides = root.querySelectorAll('.slide');
const contentSlides = [];

allSlides.forEach((slide, globalIdx) => {
  const isQuiz = slide.classList.contains('quiz-slide');
  contentSlides.push({ globalIdx, isQuiz, node: slide });
});

function getText(el) {
  return el ? el.text.replace(/\s+/g, ' ').trim() : '';
}

function buildSlideSummary(entry, prevTitle, nextTitle) {
  const { globalIdx, isQuiz, node } = entry;
  if (isQuiz) return null;

  const parts = [];
  parts.push(`Slide ${globalIdx + 1}`);

  const h1 = node.querySelector('h1');
  const h2 = node.querySelector('h2');
  const title = getText(h1 || h2);
  if (title) parts.push(`Title: ${title}`);

  const label = node.querySelector('.slide-label');
  if (label) parts.push(`Label: ${getText(label)}`);

  const paras = node.querySelectorAll('p');
  paras.forEach(p => {
    const t = getText(p);
    if (t) parts.push(`Para: ${t}`);
  });

  const callouts = node.querySelectorAll('.callout');
  callouts.forEach(c => {
    const classes = c.classNames;
    let type = 'note';
    if (classes.includes('icon-key')) type = 'key-concept';
    else if (classes.includes('icon-gotcha')) type = 'gotcha';
    else if (classes.includes('icon-tip')) type = 'tip';
    else if (classes.includes('icon-hands-on')) type = 'hands-on';
    const t = getText(c);
    if (t) parts.push(`Callout (${type}): ${t}`);
  });

  const termLabels = node.querySelectorAll('.terminal-label');
  const termBodies = node.querySelectorAll('.terminal-body');
  termLabels.forEach((lbl, i) => {
    const body = termBodies[i];
    const bodyText = body ? getText(body).slice(0, 80) : '';
    parts.push(`Code block (${getText(lbl)}): ${bodyText}…`);
  });

  const liItems = node.querySelectorAll('.annot-list li');
  liItems.forEach(li => {
    const t = getText(li);
    if (t) parts.push(`List item: ${t}`);
  });

  const plainLis = node.querySelectorAll('ul:not(.annot-list) li, ol li');
  plainLis.forEach(li => {
    const t = getText(li);
    if (t) parts.push(`List item: ${t}`);
  });

  const tables = node.querySelectorAll('table');
  tables.forEach(tbl => {
    const firstCols = tbl.querySelectorAll('td:first-child, th:first-child');
    const vals = firstCols.map(td => getText(td)).filter(Boolean);
    if (vals.length) parts.push(`Table first-col: ${vals.join(', ')}`);
  });

  const svgs = node.querySelectorAll('svg');
  if (svgs.length) parts.push(`[Diagram/SVG present]`);

  if (prevTitle) parts.push(`Previous slide: "${prevTitle}"`);
  if (nextTitle) parts.push(`Next slide: "${nextTitle}"`);

  return parts.join('\n');
}

// Build summaries — need titles for prev/next context
const titles = contentSlides.map(e => {
  const h = e.node.querySelector('h1, h2');
  return getText(h);
});

const summaries = [];
for (let i = 0; i < contentSlides.length; i++) {
  const entry = contentSlides[i];
  if (entry.isQuiz) continue;
  const prevTitle = i > 0 ? titles[i - 1] : null;
  const nextTitle = i < contentSlides.length - 1 ? titles[i + 1] : null;
  const summary = buildSlideSummary(entry, prevTitle, nextTitle);
  summaries.push({ slideIndex: entry.globalIdx, summary });
}

const objectivesList = objectives.length
  ? objectives.map((o, i) => `  ${i + 1}. ${o}`).join('\n')
  : '  (none specified)';

const systemPrompt = `You are an experienced CS lecturer recording voiceover narration for slides in a web development course.

Learning objectives for this deck:
${objectivesList}

Your job: write a natural spoken-English voiceover script for each slide, AND produce spotlight focus cues.

SCRIPT RULES:
- Learners CAN SEE the slide — do NOT read text verbatim. ADD context, analogies, and real-world "why".
- Natural spoken English; contractions fine; no bullet-by-bullet reading.
- 80–120 words per slide (~40–55 seconds at 140 wpm). Stay within this range.
- Smooth transitions: briefly reference what was just covered or what's coming next.
- For code slides: say what the code DEMONSTRATES, not what it says line by line.
- For diagram slides: describe the concept and flow, not the shapes.
- Do NOT use filler phrases like "In this slide, we'll look at…"
- Do NOT add markdown formatting — plain text only.

SPOTLIGHT SEGMENT RULES:
Each slide needs 2–4 focus segments that shift learner attention as narration progresses.
Use ONLY these target names (only use targets present in the slide's content):
  code      → terminal / code blocks
  callout   → callout boxes
  title     → slide heading (h2)
  list      → bullet or annotation lists
  diagram   → SVG diagrams / figures
  table     → tables
  columns   → multi-column layouts
  full      → release focus back to whole slide

Rules:
- First segment is ALWAYS { "start_word": 0, "target": "full" }
- start_word is the 0-indexed word position in the script when focus should shift
- Choose start_word to match when the narration is ABOUT TO discuss that element
- Slides with only plain text: just [{ "start_word": 0, "target": "full" }]
- 2–4 segments per slide (including the opening "full"); no more
- Do NOT invent targets — only use ones present in the slide summary`;

const userPrompt = `Write voiceover scripts with spotlight segments for the ${summaries.length} content slides below.

Return ONLY valid JSON in this exact format:
{"scripts": [{"slide": 0, "script": "...", "word_count": 98, "segments": [{"start_word": 0, "target": "full"}, {"start_word": 30, "target": "code"}]}, ...]}

The "slide" value must be the slide index number shown in each entry (e.g. "Slide 3" → slide: 2).

Slide summaries:
${summaries.map((s, i) => `\n--- Entry ${i + 1} ---\n${s.summary}`).join('\n')}`;

console.log(`Generating scripts for ${summaries.length} content slides (${allSlides.length} total, ${allSlides.length - summaries.length} quiz)…`);

let rawText;
if (provider === 'anthropic') {
  const client = new Anthropic();
  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 8192,
    temperature: 0.5,
    system: systemPrompt,
    messages: [{ role: 'user', content: userPrompt }],
  });
  rawText = response.content[0].text;
} else {
  const client = new OpenAI();
  const response = await client.chat.completions.create({
    model: 'gpt-4o',
    max_tokens: 8192,
    temperature: 0.5,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
  });
  rawText = response.choices[0].message.content;
}

// Extract JSON — handle optional code fence
let jsonStr = rawText.trim();
const fenceMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
if (fenceMatch) jsonStr = fenceMatch[1].trim();

let parsed;
try {
  parsed = JSON.parse(jsonStr);
} catch (e) {
  console.error('Failed to parse JSON response. Raw output saved to generate-debug.txt');
  writeFileSync('generate-debug.txt', rawText);
  process.exit(1);
}

const scripts = parsed.scripts;
if (!Array.isArray(scripts) || scripts.length !== summaries.length) {
  console.warn(`Warning: expected ${summaries.length} scripts, got ${scripts ? scripts.length : 'none'}`);
}

// ── Detect existing audio ─────────────────────────────────────────────────────
const docsDir  = path.dirname(htmlPath);
const audioDir = path.join(docsDir, 'audio', deckName);
const audioAlreadyExists = existsSync(path.join(audioDir, 'slide-0.mp3'));

// ── Generate audio if requested ───────────────────────────────────────────────
let hasAudio = audioAlreadyExists; // preserve flag if audio exists from prior run
if (doAudio) {
  mkdirSync(audioDir, { recursive: true });

  const openaiClient = new OpenAI();
  const CONCURRENCY = 5;

  console.log(`\nGenerating ${scripts.length} audio files → ${audioDir}`);
  console.log(`Voice: ${ttsVoice} · Model: ${ttsModel}`);

  // Process in batches to avoid hammering the API
  for (let i = 0; i < scripts.length; i += CONCURRENCY) {
    const batch = scripts.slice(i, i + CONCURRENCY);
    await Promise.all(batch.map(async s => {
      const mp3Path = path.join(audioDir, `slide-${s.slide}.mp3`);
      const response = await openaiClient.audio.speech.create({
        model: ttsModel,
        voice: ttsVoice,
        input: s.script,
        response_format: 'mp3',
      });
      const buffer = Buffer.from(await response.arrayBuffer());
      writeFileSync(mp3Path, buffer);
      process.stdout.write(`  ✓ slide-${s.slide}.mp3 (${buffer.length} bytes)\n`);
    }));
  }

  hasAudio = true;
  console.log(`Audio complete → docs/audio/${deckName}/`);
}

// ── Write scripts.js ──────────────────────────────────────────────────────────
const outputData = {
  deck: deckName,
  title: pageTitle,
  generated: new Date().toISOString().slice(0, 10),
  model: modelName,
  has_audio: hasAudio,
  audio_voice: hasAudio ? ttsVoice : null,
  scripts: scripts.map(s => {
    const entry = summaries.find(e => e.slideIndex === s.slide);
    const titleForSlide = entry
      ? titles[contentSlides.findIndex(c => c.globalIdx === s.slide)]
      : '';
    return {
      slide: s.slide,
      slide_title: titleForSlide || '',
      script: s.script,
      word_count: s.word_count,
      segments: Array.isArray(s.segments) ? s.segments : [{ start_word: 0, target: 'full' }],
    };
  }),
};

const outputPath = htmlPath.replace(/\.html$/, '.scripts.js');
const outputJs = `window.DECK_SCRIPTS = ${JSON.stringify(outputData, null, 2)};\n`;
writeFileSync(outputPath, outputJs);

// ── Stats ─────────────────────────────────────────────────────────────────────
const totalWords = scripts.reduce((sum, s) => sum + (s.word_count || 0), 0);
const avgWords = Math.round(totalWords / scripts.length);
const estMinutes = Math.round(totalWords / 140 * 10) / 10;

console.log(`\nDone. Output: ${outputPath}`);
console.log(`Slides processed: ${scripts.length}`);
console.log(`Average word count: ${avgWords} words`);
console.log(`Estimated total runtime: ${estMinutes} min at 140 wpm`);
if (hasAudio) {
  const charCount = scripts.reduce((sum, s) => sum + s.script.length, 0);
  const costUSD = (charCount / 1_000_000 * (useHD ? 30 : 15)).toFixed(4);
  console.log(`Audio cost: ~$${costUSD} (${charCount} chars @ ${useHD ? '$30' : '$15'}/M)`);
}
console.log('\nPer-slide word counts:');
scripts.forEach(s => console.log(`  Slide ${s.slide}: ${s.word_count}w`));
