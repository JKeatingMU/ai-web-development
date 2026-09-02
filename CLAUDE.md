# Learning Web Development by Building with AI — Course Project

## Owner
Prof. John Keating, Maynooth University, Ireland (john.keating@mu.ie) · GitHub: JKeatingMU

## Overview
Standalone CS teaching course. Every deck is a single self-contained HTML file that
loads the shared `deck-extras.js` / `deck-extras.css` engine — no build step to view.
Philosophy: build with AI, read every line, understand why it works. Prompt-reflection
throughout.

## Repo
- **This directory IS the repo.** GitHub: `JKeatingMU/ai-web-development` (public, CC BY 4.0)
- Live: https://jkeatingmu.github.io/ai-web-development/ (GitHub Pages, `main` root)
- `~/slowvibing-study/docs/` is the old pre-migration copy — stale, do not edit.
- Audio (`audio/`) IS committed so the demo plays. `.nojekyll` present.
- `crud-demo/index.html` is a redirect stub so the "Demo App" link resolves on Pages.
- `node_modules/` gitignored; `npm install` needed only to run `server/tools/`.

## Layout
```
index.html            course home (learning tree, course LOs, "how these decks work")
resources.html        tools / docs / supplements
setup-guide.html · certificate.html · study-questions.html
outline.md            SOURCE for the course structure → generates the index.html
                      learning tree, MODULE_LOS, header, About, Outcomes, Dependencies
deck-extras.js / .css shared engine (see "Deck engine" below)
*-workshop.html        26 course decks   ·   start-here.html   (S0 orientation deck)
accessible/            accessible text version of every deck + the course home (index.html)
audio/<deck>/          narrated-slide MP3s (only web-fundamentals so far)
crud-demo/             Reading List API demo (Node/Express/PostgreSQL/JWT, 7 files)
server/tools/          build-accessible.mjs · generate-deck-scripts.mjs · README.md
.claude/skills/course-deck/   skill: scaffold a new course deck
package.json           type:module; deps: node-html-parser (+ optional AI SDKs)
```

## Course structure (5 tracks + Start Here; all built except B7)

| | Track | Decks (slide count) |
|--|-------|---------------------|
| — | **Start Here** (teal) | S0 start-here (14) |
| A | **Foundations** (green `#3fb950`) | A1 web-fundamentals (17) · A2 shell (16) · A3 git (16) · A4 database (16) · A5 mongodb (16) · A6 rest (16) |
| B | **Backend API** (blue `#58a6ff`) | B1 prompt-engineering (18) · B2 ai-crud (29) · B3 auth (28) · B4 curl-testing (24) · B5 extending-api (20) · B6 validation (18) · **B7 Deployment — planned** |
| C | **Frontend** (purple `#bc8cff`) | C1 react-fundamentals (22) · C2 state-effects (17) · C3 api-integration (17) · C4 forms-validation (17) · C5 routing (17) |
| D | **Full-Stack** (yellow `#d29922`) | D1 fullstack-contracts (16) · D2 auth-end-to-end (15) · D3 deploy (13) |
| E | **AI Agents & Automation** (orange `#ffa657`) | E1 ai-agents (16) · E2 n8n-fundamentals (16) · E3 n8n-api (15) · E4 n8n-agent-node (14) · E5 n8n-building-agents (14) · E6 n8n-production (15) |

Running example across all decks: a **Reading List API**. `deck` file names are
`<slug>-workshop.html`; `deploy-workshop.html` serves as D3 (and would cover B7).

## Deck engine (`deck-extras.js` / `deck-extras.css`)
Every deck gets, for free, just by loading the engine:
- **Quiz checkpoints** — `window.DECK_QUESTIONS` (`{checkpoint, type:'mcq'|'self', q, options, correct, explanation, reviewSlide}` / self uses `model`). Rendered into `<div class="slide quiz-slide" data-checkpoint="N" data-pick="3">` placeholders. **Every deck has 2.**
- **Learning objectives** popover — `window.DECK_OBJECTIVES` (also mirrored in `MODULE_LOS` in index.html)
- **Assessments** panel — `window.DECK_ASSESSMENTS` (≥1 `practical` + ≥1 `reflect`)
- **Narrated slides** — `<deck>.scripts.js` (`window.DECK_SCRIPTS`) + audio player + spotlight; conductor annotation mode; voiceover recorder
- **Accessibility** — A−/A+ text size (shared `svl_textsize` key), light/dark, keyboard nav, skip link, `aria-live` slide announcer, `prefers-reduced-motion`, and a "Accessible version" link (auto-shown when `accessible/<deck>.html` exists)
- **Mobile** — `@media (max-width:720px)` block: slides scroll instead of clip, columns stack, controls wrap, instructor-only buttons hidden
- **Running credit** — injects `#deck-credit`: "Built with AI Assistance · Maynooth University"
- `window.DECK_NAME` must equal the `file:` key in `MODULE_LOS` in index.html.

Component/pattern reference: `~/.claude/projects/-/memory/html-slide-patterns.md`.
Narrated-slides detail: `~/.claude/projects/-/memory/narrated-slides.md`.

## Tooling (`npm install` first)
| Command | Does |
|---------|------|
| `npm run build` | `build:outline` then `build:accessible` — the one command after editing `outline.md` or a deck |
| `npm run build:outline` | `outline.md` → the generated regions of `index.html` (learning tree, `MODULE_LOS`, header, About, Outcomes, Dependencies) |
| `npm run build:accessible` | regenerates `accessible/<deck>.html` for all 27 decks + `accessible/index.html` + the `ACCESSIBLE_VERSIONS` manifest |
| `node server/tools/generate-deck-scripts.mjs <deck>.html --audio` | narration + TTS audio (needs `OPENAI_API_KEY`) |
| `/course-deck` skill | scaffold a new course deck wired to the engine; adds it to `outline.md` |

## Conventions
- No red/green adjacency — use `callout-orange` where red would signal danger; never colour-only meaning.
- Keep to the standard font sizes (h1 40 / h2 29 / p 15 / callout 14 / table 13 / code 12) so the text-size control scales in step.
- Every deck: a prompt-reflection slide, second from last.
- `#counter` start value must match the real slide count (content + quiz + reflection).

## Pending / roadmap
- **B7 Deployment** — write a real backend-only deploy deck (deploy API + Postgres to Railway before a frontend exists) via `/course-deck`.
- **Phase 3 — narration + audio** for the other 26 decks (needs an API key; ~$3 TTS). Order A→B→E→C→D.
- AI-foregrounding additions to A1 / A4 / A5.
- Cosmetic: a few accessible pages emit a stray short `<p>` from a bold sub-label in a comparison grid.

## Communication preferences
Concise, lead with the answer, no filler. No inline code comments unless non-obvious. Minimum complexity.
