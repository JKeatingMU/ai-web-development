# Course build tooling

*A formatted version of this page: [`README.html`](README.html).*

This repository holds two things: **(1) the course** — the interactive decks and
their runtime — and **(2) this toolkit** that authors and builds it. The scripts
below are (2). Run them from the repo root.

```bash
npm install          # one-time: pulls node-html-parser (+ optional AI SDKs)
```

| Script | What it does | Needs |
|--------|--------------|-------|
| `build-deck.mjs` | Compiles a deck from Markdown (`decks/<slug>.md` → `<slug>.html`). Format: [`docs/authoring.md`](../../docs/authoring.md). | markdown-it, js-yaml |
| `build-outline.mjs` | `outline.md` → the generated regions of `index.html` (header, About, Outcomes, the track sections, Dependencies, `var MODULE_LOS`). | — |
| `build-accessible.mjs` | Generates the accessible text version of every deck (`accessible/<deck>.html`) and the accessible course-home page, and rewrites the `ACCESSIBLE_VERSIONS` manifest in `index.html`. | node-html-parser |
| `generate-deck-scripts.mjs` | Generates per-slide narration scripts, and optionally TTS audio, for a deck. | `ANTHROPIC_API_KEY` or `OPENAI_API_KEY`; `--audio` needs `OPENAI_API_KEY` |

A worked example of the Markdown format: [`examples/tea/`](../../examples/tea/) —
a two-deck field guide to tea, built with `npm run build:deck examples/tea/decks/*.md`.

`npm run build` runs `build:outline` then `build:accessible` — the usual one command after any change to `outline.md` or a deck.

## build-outline.mjs

```bash
npm run build:outline            # regenerate index.html from outline.md
npm run build:outline:check      # report drift, write nothing (exit 1 if stale)
```

`outline.md` is the single source for the course structure — course title/tagline,
the philosophy blurb, the 8 course outcomes, track dependencies, and per module:
code, title, one-line card description, status, and learning objectives.

Format (see `outline.md` itself for the full example):

```markdown
---
title: Learning Web Development
title_accent: by Building with AI
subtitle: ...
tagline: ...
---

## About
Free prose — becomes the philosophy block.

## Outcomes
1. First course outcome ...

## Dependencies
- **A — Foundations** → **B — Backend API** and **C — Frontend** → **D — Fullstack**

## Track A — Foundations   {color=#3fb950}
One-line track description.
> An optional track note.

### A1 — How the Web Works   {file=web-fundamentals-workshop}
One-line card description.

- Learning objective 1
- Learning objective 2

### B7 — Deployment   {planned}
Description of a not-yet-built deck (no `{file=…}`).
```

`index.html` carries `<!-- BUILD:… -->` / `<!-- /BUILD:… -->` markers; the script
replaces only what is between them. Everything else in `index.html` (styles, the
"how these decks work" section, the legend, all the JS) is hand-maintained.

## build-deck.mjs

```bash
npm run build:deck decks/c6-testing.md          # -> c6-testing.html at repo root
npm run build:deck examples/tea/decks/*.md       # a whole example course
```

A deck is YAML frontmatter (title, code, slug, objectives, assessments, quiz)
plus a body where every `## Heading` is a slide. Callouts, code blocks, tables,
two-column layouts, AI-prompt blocks and quiz placeholders all have Markdown
syntax — see [`docs/authoring.md`](../../docs/authoring.md). The compiled deck
loads the shared `deck-extras.js` engine, so it gets quizzes, panels,
accessibility and mobile support with no per-deck code.

For a main-course deck, then add it to `outline.md` and run `npm run build`.

## build-accessible.mjs

```bash
npm run build:accessible                       # all decks + course home + manifest
node server/tools/build-accessible.mjs rest-workshop   # one deck
node server/tools/build-accessible.mjs --home          # just accessible/index.html
```

It parses each `*-workshop.html` (and `start-here.html`), walks the `.slide`
elements, and maps the deck's components to semantic HTML:

- headings → section `<h2>` / `<h3>`
- `.callout` (+ `icon-key` / `icon-gotcha` / `icon-tip` / `icon-hands-on`) → labelled `<aside class="note">`
- `.terminal` / `.diagram` / `.filetree` / monospace blocks → `<figure><pre><code>`
- `.prompt-block` → `<blockquote class="prompt">`
- `table` → scroll-wrapped table with `<th scope>`
- `.annot-list` → `<ul>` (or `<ol>` when it uses number badges)
- `.n8n-flow` → one-line workflow description
- `<svg>` → `<figure>` describing its text labels
- `.slide-label`, `.badge`, `.pill`, decorative chips → dropped
- narration from `<deck>.scripts.js` (when present) → leading `<p class="narration">`
- `window.DECK_OBJECTIVES` → "What you'll be able to do" list
- `window.DECK_ASSESSMENTS` → "Practical work" section

Output is JS-free, honours browser zoom, works with screen readers, and follows
`prefers-color-scheme`.

**When a deck's content or structure changes, rerun `npm run build:accessible`.**
Publishing a hand-authored accessible page instead is fine — just keep it in
`accessible/` and add it to `ACCESSIBLE_VERSIONS` in `index.html`.

### Limitations

- A handful of decks still emit a stray one- or two-word `<p>` from a bold
  sub-label inside a comparison grid. Cosmetic; the content is complete.
- Purely visual diagrams with no text labels are dropped. Add a `<figcaption>`
  or a describing paragraph in the source deck if the diagram carries meaning.

## generate-deck-scripts.mjs

```bash
export OPENAI_API_KEY=...          # or ANTHROPIC_API_KEY for scripts only
node server/tools/generate-deck-scripts.mjs web-fundamentals-workshop.html --audio --voice nova
```

Writes `<deck>.scripts.js` (`window.DECK_SCRIPTS`) and, with `--audio`,
`audio/<deck>/slide-N.mp3`. This repo commits the audio so the demo plays out of
the box. ~$0.12/deck for `tts-1`.
