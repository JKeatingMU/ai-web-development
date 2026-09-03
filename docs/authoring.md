# Authoring a course deck

A deck is a Markdown file. `build-deck.mjs` compiles it into a standalone HTML
deck wired to the shared runtime engine (`deck-extras.js`), which supplies
quizzes, learning-objective and assessment panels, notes, adjustable text size,
light/dark, keyboard and screen-reader support, the mobile layout, and the
"Built with AI Assistance" credit. **Your Markdown contains none of that.**

```bash
npm run build:deck decks/c6-testing.md          # -> c6-testing.html
npm run build:deck examples/tea/decks/*.md       # a whole example course
```

The HTML is written one directory above the `.md` (alongside `deck-extras.js`).
Working example: [`examples/tea/`](../examples/tea/) — a two-deck field guide to
tea, ~160 lines of Markdown per deck.

---

## File shape

```markdown
---
# ── frontmatter: structured data, YAML ──
course: Tea — A Field Guide        # optional; shown in the title and footer
track: T                           # letter (Track T) or a phrase
track_label: Tea · Field Guide     # optional override for the on-slide kicker
module: 1
code: T1
title: What Tea Is
slug: t1-what-tea-is               # output filename + window.DECK_NAME
subtitle: One line under the title
accent: "#3fb950"                  # deck accent colour
tags: [First, Second]              # small chips on the title slide
intro: >                           # the blue callout on the title slide
  A short paragraph framing the module.
index_link: ../index.html          # where "⌂ Course" points
objectives:                        # -> the ⓘ learning-objectives panel
  - First objective
  - Second objective
assessments:                       # -> the ★ assessments panel
  - type: practical
    title: Task title
    desc: >
      What to do, in full.
    criteria:
      - A checkable criterion
      - Another
  - type: reflect
    title: A reflection prompt
    desc: The question.
quiz:                              # -> the checkpoint quizzes
  1:
    - q: A multiple-choice question?
      options: [Wrong, Right, Wrong, Wrong]
      correct: 1                    # 0-indexed
      explanation: Why the right answer is right.
    - type: self
      q: An open question to answer and self-mark.
      model: The model answer to reveal and compare against.
  2:
    - q: ...
---

## First slide title

Body text. **Bold**, *italic*, `code`, [links](https://example.com) all work.

> **Key concept** — a blockquote becomes a callout. The bold leader word picks
> the style: Key concept, Tip, Gotcha, Warning, Hands-on, Note.

## A slide with two columns

::: cols
Left column content — any Markdown.
+++
Right column content.
:::

## A slide with a code block

```js  server.js
app.get('/api/health', (req, res) => res.json({ ok: true }));
```

## A slide with an AI prompt

::: prompt  Optional label
The prompt text you want the learner to try with an AI assistant.
:::

## Checkpoint {quiz=1}

## Where this fits {section}

A section-header slide — centred, just a heading and optional text.

## Part two {part=2/3}

A part-divider slide with a big number.

## What did you actually learn? {reflect}

The prompt-reflection slide. Put it second from last.

- A reflection question
- Another
```

---

## Slides

Every `## Heading` starts a new slide, in order. The compiler adds a **title
slide** first (from the frontmatter) — you don't write it.

| On the heading | Effect |
|----------------|--------|
| `## Title` | a normal content slide |
| `## Title {section}` | a centred section divider |
| `## Title {part=2/3}` | a part divider with "02" and "Part 2 of 3" |
| `## Title {reflect}` | styled as the prompt-reflection slide (its body is wrapped in a purple callout) |
| `## Checkpoint {quiz=1}` | a checkpoint-1 quiz placeholder — the questions come from frontmatter `quiz.1` |

Use **exactly two** `{quiz=…}` slides, roughly halfway and about 80 % through.

## Blocks inside a slide

| Markdown | Becomes |
|----------|---------|
| `> text` | a callout (blue by default) |
| `> **Key concept** text` | callout with the ★ Key Concept badge |
| `> **Gotcha** text` / `> **Warning** text` | orange callout, ⚡ Gotcha badge |
| `> **Tip** text` | blue callout, ◆ Tip badge |
| `> **Hands-on** text` / `> **Try it** text` | green callout, ▶ Hands-On badge |
| `> **Note** text` | purple callout, no badge |
| ` ```lang  label ` fenced code | a terminal block; the words after the language are the label |
| `\| a \| table \|` | a table |
| `- item` / `1. item` | a list |
| `::: cols` … `+++` … `:::` | side-by-side columns (`+++` on its own line separates them; use it more than once for 3+) |
| `::: prompt Label` … `:::` | an "Ask an AI" prompt block |

Code blocks are shown as plain monospace — no syntax colouring. Keep them short;
they scroll if long.

## Conventions (carried over from the interactive course)

- One running example per course; don't invent new domains mid-course.
- No meaning by colour alone — the callout badges carry a word, not just a hue.
- Keep slides to one idea. If a slide feels crowded, split it.
- A prompt-reflection slide, second from last.

## After compiling

For a deck in the **main course** (`decks/<slug>.md` → repo root), also:

1. Add the module to [`outline.md`](../outline.md) under its `## Track` heading
   (`### <CODE> — <Title> {file=<slug>}` + description + LO bullets).
2. `npm run build` — writes the card and `MODULE_LOS` into `index.html` and
   regenerates the accessible text version.

Example-course decks (`examples/*/decks/`) need only `npm run build:deck`.
