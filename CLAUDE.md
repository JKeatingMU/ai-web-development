# Learning Web Development by Building with AI — Course Project

## Owner
Prof. John Keating, Maynooth University, Ireland (john.keating@mu.ie)
GitHub: JKeatingMU

## Project Overview
A standalone CS teaching course: "Learning Web Development by Building with AI"
Built March 2026+. All slide decks are standalone HTML files (no build step).
Course philosophy: build with AI, read every line, understand why it works.
Prompt reflection throughout — AI as a thinking partner, not an answer machine.

## Location & Repo (MIGRATION DONE — 2026-09-02)
This directory IS the course repo now. Work here, not in `~/slowvibing-study/docs/`.
- GitHub: `JKeatingMU/ai-web-development` (public, CC BY 4.0)
- Live demo (GitHub Pages, main branch root): https://jkeatingmu.github.io/ai-web-development/
- `~/slowvibing-study/docs/` is the old copy — stale, do not edit. The study repo
  may still want a `/docs` deploy later (see slowvibing-study memory); if so, sync
  from here.
- Audio IS committed here (not gitignored) so the Pages demo works. `.nojekyll` present.
- `crud-demo/index.html` is a redirect stub so the "Demo App" link resolves on Pages.

## Structure
```
~/AI-Web-Development/
├── CLAUDE.md               ← this file
├── index.html              ← course home (learning tree, 5 tracks A–E)
├── resources.html          ← tools, docs, AI tools, n8n, supplements
├── deck-extras.js          ← shared quiz/LO/audio/annotation engine
├── deck-extras.css         ← shared styles
├── crud-demo/              ← Reading List API demo app (7 files)
├── audio/                  ← narrated slide MP3s (committed; only web-fundamentals so far)
├── web-fundamentals-workshop.html
├── shell-workshop.html
├── git-workshop.html
├── ... (all decks)
└── server/
    └── tools/
        └── generate-deck-scripts.mjs  ← narrated slides generator
```

## Course Structure (5 tracks, 27 decks ready as of April 2026)

### Track A — Foundations (green #3fb950)
| ID | File | Slides |
|----|------|--------|
| A1 | `web-fundamentals-workshop.html` | 15 |
| A2 | `shell-workshop.html` | 16 |
| A3 | `git-workshop.html` | 16 |
| A4 | `database-workshop.html` | 16 |
| A5 | `mongodb-workshop.html` | 16 |
| A6 | `rest-workshop.html` | 16 |

### Track B — Backend (blue #58a6ff)
| ID | File | Slides |
|----|------|--------|
| B1 | `prompt-engineering-workshop.html` | 18 |
| B2 | `ai-crud-workshop.html` | 29 |
| B3 | `auth-workshop.html` | 28 |
| B4 | `curl-testing-workshop.html` | 24 |
| B5 | `extending-api-workshop.html` | 20 |
| B6 | `validation-workshop.html` | 18 |

### Track C — Frontend (purple #bc8cff) — planned
| ID | File | Slides |
|----|------|--------|
| C1–C5 | planned | — |

### Track D — Full-Stack (yellow #d29922) — planned
| ID | File | Slides |
|----|------|--------|
| D1–D3 | planned | — |

### Track E — AI Agents & Automation (orange #ffa657)
| ID | File | Slides |
|----|------|--------|
| E1 | `ai-agents-workshop.html` | 14 |
| E2 | `n8n-fundamentals-workshop.html` | 14 |
| E3 | `n8n-api-workshop.html` | 13 |
| E4 | `n8n-agent-node-workshop.html` | 12 |
| E5 | `n8n-building-agents-workshop.html` | 12 |
| E6 | `n8n-production-workshop.html` | 13 |

## Running Example
All decks use a **Reading List API** (Node/Express/PostgreSQL/JWT) as the running example.
Demo app in `crud-demo/` — 7 files, fully working.

## Deck Architecture
All decks share:
- `deck-extras.js` / `deck-extras.css` — LO popover, quiz engine, assessments,
  progress tracking, narrated slides, conductor annotation mode
- `window.DECK_NAME` — must match `file:` key in `MODULE_LOS` in `index.html`
- `window.DECK_ASSESSMENTS` — practical tasks + reflection
- `window.DECK_QUESTIONS` — MCQ + self-reflection per checkpoint
- Fixed footer: `#app-link` (localhost:3001), `#index-link` (⌂ Course → index.html)

Full component/pattern reference: `~/.claude/projects/-/memory/html-slide-patterns.md`

## Narrated Slides System
- Generator: `server/tools/generate-deck-scripts.mjs` (`--audio --voice --hd` flags)
- Output: `<deck>.scripts.js` + `audio/<deck>/slide-n.mp3` (gitignored)
- Conductor annotation mode: implemented in deck-extras.js (initAnnotation)
- Full detail: `~/.claude/projects/-/memory/narrated-slides.md`

## Pending Work
- B7 deck — Deployment (review scope vs D3 first)
- Tracks C and D — all planned, none built
- AI-foregrounding additions to A1, A4, A5
- Migration from `~/slowvibing-study/docs/` to this directory
- Set up as separate git repo (JKeatingMU/ai-web-development, private)

## Accessibility
- No red/green adjacency — use `callout-orange` where red would traditionally appear
- Track colours: A=green, B=blue, C=purple, D=yellow, E=orange

## Communication Preferences
- Concise and direct — no preamble, no filler
- No inline explanatory comments unless logic is non-obvious
- No over-engineering — minimum complexity for the task
