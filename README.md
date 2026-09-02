# Learning Web Development by Building with AI

A practical course in full-stack web development.
**Build real things. Read what the AI wrote. Understand every line.**

Standalone HTML slide decks — no build step, no dependencies. Every deck uses a
single running example (a **Reading List API**: Node / Express / PostgreSQL / JWT)
and carries checkpoint quizzes, learning objectives, practical assessments, and a
prompt-reflection slide.

## Live demo

<https://jkeatingmu.github.io/ai-web-development/>

> ⚠️ **Work in progress.** Tracks A, B and E are drafted; Tracks C and D are
> planned. Some decks reference a narration script that has not been generated
> yet (harmless 404 in the console — the deck still runs). Only the
> *Web Fundamentals* deck currently has narrated audio.

## Course structure

| Track | Theme | Status |
|-------|-------|--------|
| **A — Foundations** | web basics, shell, git, SQL, MongoDB, REST | drafted (6 decks) |
| **B — Backend** | prompt engineering, CRUD, auth, curl testing, extending an API, validation | drafted (6 decks) |
| **C — Frontend** | React, routing, state & effects, forms | planned |
| **D — Full-Stack** | contracts, end-to-end auth, API integration | planned |
| **E — AI Agents & Automation** | agents, n8n fundamentals → production | drafted (6 decks) |

Start at [`index.html`](index.html) — the learning tree links every deck.

## Running locally

The decks are static files, but audio playback needs a real HTTP server
(browsers block media over `file://`):

```bash
cd ai-web-development
python3 -m http.server 8000
# open http://localhost:8000
```

The footer "app" link in each deck points at `localhost:3001` — that is the
optional demo API in [`crud-demo/`](crud-demo/), not required to view the course:

```bash
cd crud-demo
cp .env.example .env   # set DATABASE_URL, JWT_SECRET
npm install
npm start
```

## Narrated slides

Generator: [`server/tools/generate-deck-scripts.mjs`](server/tools/generate-deck-scripts.mjs)
(`--audio --voice --hd` flags). Produces `<deck>.scripts.js` plus
`audio/<deck>/slide-N.mp3`. Audio files are committed so the demo works out of
the box.

## Licence

[CC BY 4.0](LICENSE) — © John Keating, Maynooth University. Reuse and adapt with
attribution.
