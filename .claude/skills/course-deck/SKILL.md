---
name: course-deck
description: Scaffold a new slide deck for the "Learning Web Development by Building with AI" course - a standalone HTML file wired to the shared deck-extras engine (quizzes, learning objectives, assessments, narration, accessibility, mobile) and registered in index.html. Use when adding a module - e.g. the planned B7 Deployment deck, or extra modules in any track.
---

# course-deck

Creates one course deck: a standalone `<deck-name>-workshop.html` file in the repo
root that loads `deck-extras.js` / `deck-extras.css`, plus its `index.html` card and
`MODULE_LOS` entry.

This is **not** the general-purpose `/deck` command (blue/teal talk decks). Course
decks are dark GitHub-style, 15-30 slides, one running example (the Reading List
API), exactly 2 checkpoint quizzes, and a prompt-reflection slide.

The shared engine (`deck-extras.js` / `.css`) adds everything else automatically —
quiz rendering, LO/assessment panels, narration player, text-size + theme controls,
keyboard + screen-reader support, the mobile layout, and the "Built with AI
Assistance · Maynooth University" credit line. **The deck HTML contains none of that.**

## When invoked

1. If no topic given, ask for: track (A-E), module number, title, and a
   one-line description.
2. Propose a slide list — title slide, 12-28 content slides, 2 quiz checkpoints
   (~50% and ~82% through), an "AI assumes / verify" slide, a Key Terms slide, and
   a prompt-reflection slide — and confirm before writing.
3. Write `<slug>-workshop.html` in the repo root from the skeleton below.
4. Add the card + `MODULE_LOS` entry to `index.html`.
5. Run the verification checklist.
6. Follow-ups:
   - `npm run build:accessible` — regenerates `accessible/<slug>-workshop.html`
     and adds it to the `ACCESSIBLE_VERSIONS` manifest. Do this whenever a deck
     is added or changed.
   - `node server/tools/generate-deck-scripts.mjs <slug>-workshop.html --audio`
     — narration + TTS audio (needs `OPENAI_API_KEY`).

## Track colours

| Track | Theme | Accent hex |
|-------|-------|-----------|
| A Foundations | green | `#3fb950` |
| B Backend | blue | `#58a6ff` |
| C Frontend | purple | `#bc8cff` |
| D Full-Stack | yellow | `#d29922` |
| E AI Agents & Automation | orange | `#ffa657` |

Track E also overrides: `--accent:#ffa657; --highlight:#8a3800; --prompt-border:#c4621a;`
and part-slide gradient `linear-gradient(135deg,#200e02 0%,#150901 100%)`.

## File skeleton

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>DECK TITLE — Learning Web Development by Building with AI</title>
<style>
  :root {
    --bg:#0f1117; --slide-bg:#161b22; --border:#30363d;
    --text:#e6edf3; --muted:#8b949e;
    --accent:#58a6ff; --green:#3fb950; --yellow:#d29922;
    --red:#f85149; --purple:#bc8cff; --orange:#ffa657;
    --term-bg:#010409; --term-text:#c9d1d9;
    --highlight:#1f6feb; --prompt-border:#388bfd;
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
  p{font-size:15px;color:var(--muted);line-height:1.7;margin-bottom:10px;}
  strong{color:var(--text);font-weight:600;}
  code{font-family:'SF Mono','Fira Code',monospace;font-size:12px;background:rgba(110,118,129,.1);padding:2px 5px;border-radius:4px;color:var(--orange);}
  .terminal{background:var(--term-bg);border:1px solid var(--border);border-radius:8px;overflow:hidden;margin:12px 0;flex-shrink:0;}
  .terminal-bar{background:#21262d;padding:7px 14px;display:flex;align-items:center;gap:8px;border-bottom:1px solid var(--border);}
  .dot{width:11px;height:11px;border-radius:50%;} .dot-red{background:#f85149;} .dot-yellow{background:#d29922;} .dot-green{background:#3fb950;}
  .terminal-label{font-size:12px;color:var(--muted);margin-left:8px;font-family:'SF Mono',monospace;}
  .terminal-body{padding:15px 20px;font-family:'SF Mono','Fira Code',monospace;font-size:13px;line-height:1.7;color:var(--term-text);overflow:auto;max-height:min(55vh,400px);white-space:pre;}
  .kw{color:var(--purple);} .fn{color:var(--accent);} .str{color:#a5d6ff;} .num{color:var(--orange);}
  .cmt{color:#5c6370;font-style:italic;} .key{color:var(--purple);} .gr{color:var(--green);} .or{color:var(--orange);} .hi{color:var(--accent);}
  .callout{border-radius:8px;padding:14px 18px;font-size:14px;line-height:1.7;border-left-width:3px;border-left-style:solid;margin:6px 0;}
  .callout-blue{background:rgba(88,166,255,.07);border-color:var(--accent);color:var(--text);}
  .callout-green{background:rgba(63,185,80,.07);border-color:var(--green);color:var(--text);}
  .callout-yellow{background:rgba(210,153,34,.07);border-color:var(--yellow);color:var(--text);}
  .callout-orange{background:rgba(255,166,87,.07);border-color:var(--orange);color:var(--text);}
  .callout-purple{background:rgba(188,140,255,.07);border-color:var(--purple);color:var(--text);}
  .cols{display:flex;gap:20px;align-items:stretch;}
  .cols>div{flex:1;} .cols-55-45>div:first-child{flex:55;} .cols-55-45>div:last-child{flex:45;}
  table{width:100%;border-collapse:collapse;font-size:13px;}
  th{text-align:left;padding:8px 12px;background:rgba(255,255,255,.04);color:var(--text);font-weight:600;border-bottom:1px solid var(--border);}
  td{padding:8px 12px;color:var(--muted);border-bottom:1px solid rgba(48,54,61,.6);vertical-align:top;}
  .badge{display:inline-block;font-size:11px;font-weight:700;padding:2px 8px;border-radius:4px;font-family:'SF Mono',monospace;}
  .badge-blue{background:rgba(88,166,255,.15);color:var(--accent);border:1px solid rgba(88,166,255,.3);}
  .badge-num{background:var(--highlight);color:#fff;}
  .annot-list{list-style:none;display:flex;flex-direction:column;gap:10px;margin-top:8px;}
  .annot-list li{display:flex;align-items:flex-start;gap:10px;font-size:14px;color:var(--muted);line-height:1.6;}
  .prompt-block{background:rgba(56,139,253,.06);border:1px solid var(--prompt-border);border-radius:8px;padding:14px 18px;margin:10px 0;font-size:14px;line-height:1.7;}
  .prompt-block .label{font-size:11px;text-transform:uppercase;letter-spacing:1px;color:var(--accent);margin-bottom:6px;font-weight:700;}
  #nav{position:fixed;bottom:28px;right:38px;display:flex;align-items:center;gap:10px;z-index:100;}
  #counter{font-size:12px;color:var(--muted);font-family:monospace;}
  .nav-btn{background:var(--slide-bg);border:1px solid var(--border);color:var(--text);width:34px;height:34px;border-radius:8px;cursor:pointer;font-size:16px;display:flex;align-items:center;justify-content:center;}
  #progress{position:fixed;bottom:0;left:0;height:3px;background:var(--accent);transition:width .3s ease;z-index:100;}
  #hint{position:fixed;top:18px;right:38px;font-size:11px;color:var(--muted);font-family:monospace;}
  #app-link{position:fixed;bottom:28px;left:38px;font-size:11px;font-family:'SF Mono',monospace;color:var(--muted);text-decoration:none;background:rgba(22,27,34,.9);border:1px solid var(--border);padding:4px 10px;border-radius:6px;z-index:200;}
  #index-link{position:fixed;bottom:28px;left:50%;transform:translateX(-50%);font-size:11px;font-family:'SF Mono',monospace;color:var(--muted);text-decoration:none;background:rgba(22,27,34,.9);border:1px solid var(--border);padding:4px 10px;border-radius:6px;z-index:200;}
</style>
<link rel="stylesheet" href="deck-extras.css">
</head>
<body>

<!-- Slide 1 — Title -->
<div class="slide active">
  <div class="slide-label">Track X · Foundations · Module N</div>
  <h1>Deck <span class="accent">Title</span></h1>
  <div class="subtitle">One line on what this module covers</div>
  <div class="callout callout-blue">Why this module exists and what the learner will be able to do after it.</div>
</div>

<!-- Content slides: .slide with .slide-label + h2 + content -->
<!-- Part header: <div class="slide part-slide"><div class="part-num">02</div><div class="slide-label">Part 2 of 3</div><h2>Section</h2><p>...</p></div> -->
<!-- Quiz checkpoint: <div class="slide quiz-slide" data-checkpoint="1" data-pick="3"></div> -->

<!-- Prompt reflection (second to last slide) -->
<div class="slide" style="justify-content:center;">
  <div style="max-width:640px;width:100%;display:flex;flex-direction:column;gap:20px;">
    <div style="text-align:center;">
      <div class="slide-label" style="margin-bottom:6px;">Prompt Reflection</div>
      <h2 style="margin-bottom:0;">What did you actually build?</h2>
    </div>
    <div class="callout callout-purple">
      <strong>Think back through this session</strong>
      <ul style="margin:8px 0 0 18px;font-size:14px;line-height:1.8;">
        <li>Which prompt produced the most usable code? Why?</li>
        <li>Where did you have to correct or reject what the AI wrote?</li>
        <li>What would you put in the prompt next time?</li>
      </ul>
    </div>
  </div>
</div>

<a href="http://localhost:3001/api/health" target="_blank" id="app-link">localhost:3001 ↗</a>
<a href="index.html" id="index-link">⌂ Course</a>
<div id="nav">
  <span id="counter">1 / N</span>
  <button class="nav-btn" id="prev">&#8249;</button>
  <button class="nav-btn" id="next">&#8250;</button>
</div>
<div id="progress"></div>
<div id="hint">← → to navigate · F for fullscreen</div>

<script>
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
  show(0);
</script>

<script>
window.DECK_NAME = 'SLUG-workshop';
</script>

<script>
window.DECK_OBJECTIVES = [
  'Learning objective 1 — action verb + measurable outcome',
  'Learning objective 2',
  'Learning objective 3',
  'Learning objective 4',
  'Learning objective 5',
];
</script>

<script>
window.DECK_ASSESSMENTS = [
  { id: 'xN-1', type: 'practical', title: 'Task title',
    desc: 'What to build, in full.',
    criteria: ['Criterion 1', 'Criterion 2', 'Criterion 3'] },
  { id: 'xN-2', type: 'reflect', title: 'Reflection task',
    desc: 'A prompt-reflection question tied to this module.' },
];
</script>

<script>
window.DECK_QUESTIONS = [
  { checkpoint: 1, type: 'mcq',
    q: 'Question?',
    options: ['A', 'B', 'C', 'D'],
    correct: 0,                                  // 0-indexed
    explanation: 'Why the correct option is correct.',
    reviewSlide: 'Slide title to jump back to' },
  { checkpoint: 1, type: 'self',
    q: 'Self-reflection question?',
    model: 'A model answer to reveal for comparison.' },
  // ... repeat with checkpoint: 2
];
</script>

<script src="deck-extras.js"></script>
</body>
</html>
```

## index.html wiring

**Card** — inside the right `<section class="track track-X">` card row, change the
planned placeholder to:

```html
<a class="card available card-x" href="SLUG-workshop.html">
  <div class="card-code">X3</div>
  <div class="card-title">Deck Title</div>
  <div class="card-desc">Short description</div>
  <div class="card-reflect">Includes prompt reflection</div>
</a>
```

**MODULE_LOS** — in the `<script>` block near the bottom of `index.html`:

```js
'X3': { title: 'Deck Title', color: '#bc8cff', file: 'SLUG-workshop', los: [
  'Learning objective 1 — action verb + measurable outcome',
  'Learning objective 2',
  'Learning objective 3',
  'Learning objective 4',
  'Learning objective 5',
]},
```

`file:` must equal `window.DECK_NAME` exactly (both without `.html`).
Keep the `los:` array here identical to `window.DECK_OBJECTIVES` in the deck.

## Track accent

The skeleton `:root` is blue (Track B). For another track, override in `:root`:

| Track | `--accent` | also set |
|-------|-----------|----------|
| A | `#3fb950` | — |
| C | `#bc8cff` | — |
| D | `#d29922` | — |
| E | `#ffa657` | `--highlight:#8a3800; --prompt-border:#c4621a;` + part-slide gradient `linear-gradient(135deg,#200e02 0%,#150901 100%)` |

Card class is `card-a` / `card-b` / … matching the track.

## Rules

- **Font sizes:** keep to the standard sizes above (h1 40 / h2 29 / p 15 /
  callout 14 / table 13 / code 12). The engine's text-size control and the
  accessible-version generator both assume these; custom inline sizes will not
  scale in step.
- **No red/green adjacency.** Use `callout-orange` where red would signal danger.
  Never carry meaning by colour alone — pair it with a word or icon.
- **Scrollable code:** every `.terminal-body` / `.diagram` / `.filetree` needs
  `overflow:auto; max-height:min(55vh,400px)`.
- **Counter** `1 / N` must match the real slide count (content + 2 quiz slides +
  reflection).
- Running example is always the **Reading List API**. Don't invent a new domain.
- One prompt-reflection slide, second from last.
- No inline explanatory comments in the generated JS unless genuinely non-obvious.
- Do NOT hand-add any accessibility, mobile, credit, or nav-chrome CSS/JS beyond
  the skeleton — the engine owns all of it.

## Verification checklist

- [ ] `window.DECK_NAME` matches the `file:` key in `MODULE_LOS`
- [ ] `window.DECK_OBJECTIVES` matches the `los:` array in `MODULE_LOS`
- [ ] Card `href` matches the filename; card is `available` (not `planned`)
- [ ] `#counter` start value matches slide count
- [ ] Exactly 2 `quiz-slide` divs; each `data-checkpoint` has questions in `DECK_QUESTIONS`
- [ ] `DECK_ASSESSMENTS` has at least one `practical` and one `reflect`
- [ ] `--accent` + `card-x` class match the track
- [ ] Prompt-reflection slide present, second from last
- [ ] Opens with no console errors when served over http; quizzes render
- [ ] Ran `npm run build:accessible` (adds the accessible version + manifest entry)
