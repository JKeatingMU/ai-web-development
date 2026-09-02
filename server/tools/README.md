# Course build tooling

Scripts that generate derived artefacts for the course. Run from the repo root.

```bash
npm install          # one-time: pulls node-html-parser (+ optional AI SDKs)
```

| Script | What it does | Needs |
|--------|--------------|-------|
| `build-accessible.mjs` | Generates the accessible text version of every deck (`accessible/<deck>.html`) and the accessible course-home page, and rewrites the `ACCESSIBLE_VERSIONS` manifest in `index.html`. | node-html-parser |
| `generate-deck-scripts.mjs` | Generates per-slide narration scripts, and optionally TTS audio, for a deck. | `ANTHROPIC_API_KEY` or `OPENAI_API_KEY`; `--audio` needs `OPENAI_API_KEY` |

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
