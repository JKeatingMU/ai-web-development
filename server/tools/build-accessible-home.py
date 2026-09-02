#!/usr/bin/env python3
"""One-off: build accessible/index.html — the accessible long-form version of the course home page."""
import html, json, re, pathlib

ROOT = pathlib.Path.home() / "AI-Web-Development"
idx = (ROOT / "index.html").read_text()

# --- pull MODULE_LOS ---
m = re.search(r'var MODULE_LOS = (\{.*?\n\});', idx, re.S).group(1)
entries = re.findall(
    r"'([A-Z0-9]+)':\s*\{\s*title:\s*'([^']*)',\s*color:\s*'([^']*)',\s*file:\s*'([^']*)',\s*los:\s*\[(.*?)\]\s*\}",
    m, re.S)
LOS = {}
for code, title, color, file, raw in entries:
    los = [x.replace("\\'", "'") for x in re.findall(r"'((?:[^'\\]|\\.)*)'", raw)]
    LOS[code] = {"title": title, "file": file, "los": los}

ACCESSIBLE = {"web-fundamentals-workshop": "web-fundamentals-workshop.html"}

# --- track + card data (from index.html, transcribed) ---
TRACKS = [
    ("Start Here — Orientation",
     "Read this before Track A: the prompting mindset, the reading habit, and how this course works.",
     [("S0", "start-here.html", "Prompting philosophy, good vs bad prompts, what AI gets wrong, the reading checklist, and the vibe-coding debate.", False)]),
    ("Track A — Foundations",
     "Core concepts every web developer needs before writing a line of backend code.",
     [("A1", "web-fundamentals-workshop.html", "HTTP request/response, status codes, DNS, browsers, JSON.", False),
      ("A2", "shell-workshop.html", "Navigation, pipes, environment variables, aliases, scripting.", False),
      ("A3", "git-workshop.html", "Version control, commit, push, branches, pull requests, GitHub Pages.", False),
      ("A4", "database-workshop.html", "Tables, SQL, psql, primary keys, constraints, transactions.", False),
      ("A5", "mongodb-workshop.html", "Collections, documents, Mongoose, embed vs reference, aggregation pipelines.", False),
      ("A6", "rest-workshop.html", "Methods, URI design, status codes, statelessness, error design.", False)]),
    ("Track B — Backend API",
     "Build a production-quality REST API from scratch, using AI as your coding partner. The running example is a Reading List API (Node, Express, PostgreSQL, JWT).",
     [("B1", "prompt-engineering-workshop.html", "Four prompt types: Scaffold, Explain, Debug, Extend.", False),
      ("B2", "ai-crud-workshop.html", "Node.js, Express, PostgreSQL; a generated-code walkthrough.", False),
      ("B3", "auth-workshop.html", "JWT, bcrypt, middleware, protected routes.", False),
      ("B4", "curl-testing-workshop.html", "curl, jq, a scripted API test workflow.", False),
      ("B5", "extending-api-workshop.html", "Pagination, relational data, JOIN queries.", False),
      ("B6", "validation-workshop.html", "Input validation, error middleware, Zod, asyncHandler.", False),
      ("B7", "deploy-workshop.html", "Railway, environment variables, Railway PostgreSQL, live testing. (Planned — not yet available.)", True)]),
    ("Track C — Frontend",
     "Build a React application that connects to your API.",
     [("C1", "react-fundamentals-workshop.html", "Components, JSX, props, useState, events, forms, lists.", False),
      ("C2", "state-effects-workshop.html", "useEffect, async fetch, cleanup, custom hooks, useMemo.", False),
      ("C3", "api-integration-workshop.html", "CORS, environment variables, Vite proxy, a centralised api.ts, token storage.", False),
      ("C4", "forms-validation-workshop.html", "Controlled inputs, a generic onChange, validation, aria-describedby.", False),
      ("C5", "routing-workshop.html", "React Router v6, Link, useParams, useNavigate, ProtectedRoute.", False)]),
    ("Track D — Fullstack",
     "Connect everything. Requires Tracks B and C.",
     [("D1", "fullstack-contracts-workshop.html", "Architecture, shared types, API contracts, production CORS, Express serving React.", False),
      ("D2", "auth-end-to-end-workshop.html", "Register, login, a useAuth hook, token lifecycle, logout.", False),
      ("D3", "deploy-workshop.html", "npm run build, Railway, schema setup, environment variables, live testing.", False)]),
    ("Track E — AI Agents & Automation",
     "Build autonomous workflows with n8n and large language model APIs.",
     [("E1", "ai-agents-workshop.html", "LLMs plus tools plus loops; the ReAct pattern; agent vs chatbot.", False),
      ("E2", "n8n-fundamentals-workshop.html", "Nodes, expressions, credentials, the item model.", False),
      ("E3", "n8n-api-workshop.html", "Login for a JWT, full CRUD, data mapping, debugging errors.", False),
      ("E4", "n8n-agent-node-workshop.html", "Tool nodes, system prompts, memory, testing.", False),
      ("E5", "n8n-building-agents-workshop.html", "Research; summarise and tag; monitor and notify.", False),
      ("E6", "n8n-production-workshop.html", "Error workflows, approval gates, monitoring, cost.", False)]),
]

COURSE_LOS = [
 "Explain how the web works — HTTP, DNS, status codes, request-response — and trace a request from browser to database",
 "Use the terminal confidently: navigate the filesystem, compose shell pipelines, manage environment variables, and write shell scripts",
 "Track and share code using Git and GitHub, including branching, pull requests, and publishing via GitHub Pages",
 "Design relational database schemas, write SQL queries, apply constraints and JOIN operations, and manage schema evolution safely",
 "Build a fully functional REST API from scratch using Node.js, Express, and PostgreSQL, with authentication via JWT",
 "Apply prompt engineering strategies — Scaffold, Explain, Debug, Extend — to direct AI assistants effectively at each stage of development",
 "Read and evaluate AI-generated code critically: identify patterns, security risks, and design tradeoffs rather than accepting output blindly",
 "Deploy a working server-side application to a cloud platform with proper environment configuration and database integration",
]

def esc(s): return html.escape(s, quote=False)

def slug(t):
    return re.sub(r'[^a-z0-9]+', '-', t.lower()).strip('-')

parts = []
parts.append('''<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Course outline — accessible text version — Learning Web Development by Building with AI</title>
<style>
  :root { --bg:#fff; --text:#1a1a1a; --muted:#4a4a4a; --rule:#d0d0d0; --accent:#0b5fa5; --card-bg:#f7f7f7; }
  @media (prefers-color-scheme: dark) {
    :root { --bg:#14171c; --text:#e8e8e8; --muted:#b3b3b3; --rule:#3a3f47; --accent:#6fb3ff; --card-bg:#1b1f26; }
  }
  * { box-sizing: border-box; }
  body { margin:0; background:var(--bg); color:var(--text);
    font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif; line-height:1.7; }
  .wrap { max-width:44rem; margin:0 auto; padding:2rem 1.25rem 5rem; }
  a { color:var(--accent); }
  a:focus-visible { outline:3px solid var(--accent); outline-offset:2px; }
  .skip { position:absolute; left:-9999px; top:0; background:var(--accent); color:#fff; padding:.6rem 1rem; border-radius:0 0 6px 0; }
  .skip:focus { left:0; }
  header.doc { border-bottom:2px solid var(--rule); padding-bottom:1.25rem; margin-bottom:1.5rem; }
  h1 { font-size:1.9rem; margin:0 0 .4rem; }
  .kicker { font-size:.8rem; letter-spacing:.12em; text-transform:uppercase; color:var(--muted); margin:0 0 .6rem; }
  .lede { color:var(--muted); margin:.5rem 0 0; }
  .note { background:var(--card-bg); border:1px solid var(--rule); border-left:4px solid var(--accent);
    padding:.9rem 1.1rem; border-radius:4px; margin:1.25rem 0; font-size:.97rem; }
  .note p { margin:.4rem 0; } .note p:first-child { margin-top:0; } .note p:last-child { margin-bottom:0; }
  nav.toc { margin:1.5rem 0 2.5rem; }
  nav.toc h2 { font-size:1rem; text-transform:uppercase; letter-spacing:.08em; color:var(--muted); border:0; margin:0 0 .5rem; padding:0; }
  nav.toc ol { margin:0; padding-left:1.4rem; } nav.toc li { margin:.3rem 0; }
  section { margin:2.75rem 0; }
  h2 { font-size:1.4rem; line-height:1.3; margin:0 0 .5rem; padding-top:.5rem; border-top:1px solid var(--rule); }
  section:first-of-type h2 { border-top:0; padding-top:0; }
  h3 { font-size:1.1rem; margin:1.75rem 0 .35rem; }
  p { margin:.75rem 0; }
  ul, ol { padding-left:1.4rem; } li { margin:.3rem 0; }
  .module { border:1px solid var(--rule); background:var(--card-bg); border-radius:6px; padding:1rem 1.2rem; margin:1rem 0; }
  .module h3 { margin-top:0; }
  .module .desc { color:var(--muted); margin:.35rem 0 .6rem; }
  .module .lo-lead { font-weight:600; font-size:.95rem; margin:.6rem 0 .2rem; }
  .module ul { margin:.2rem 0; }
  .module .links { margin-top:.7rem; font-size:.95rem; }
  .module.planned { opacity:.75; }
  .tag { display:inline-block; font-size:.75rem; font-weight:700; text-transform:uppercase; letter-spacing:.05em;
    border:1px solid var(--rule); border-radius:3px; padding:.05rem .4rem; margin-left:.4rem; color:var(--muted); vertical-align:middle; }
  footer.doc { margin-top:3rem; padding-top:1.25rem; border-top:2px solid var(--rule); font-size:.92rem; color:var(--muted); }
  @media (prefers-reduced-motion: reduce) { * { transition-duration:.001ms !important; } }
</style>
</head>
<body>
<a class="skip" href="#main">Skip to content</a>
<div class="wrap">

<header class="doc">
  <p class="kicker">Course outline &middot; accessible text version</p>
  <h1>Learning Web Development by Building with AI</h1>
  <p class="lede">A practical course in full-stack web development. Build real things, read what the AI wrote, understand every line.</p>
</header>

<div class="note">
  <p><strong>This is the accessible text version of the course home page.</strong> It lists every module in reading order, with what you will be able to do after each one, as a single linear page: no interactive widgets, and it responds normally to browser zoom and to screen readers.</p>
  <p><a href="../index.html">Open the interactive course home</a> &nbsp;&middot;&nbsp; <a href="../setup-guide.html">Setup guide</a> &nbsp;&middot;&nbsp; <a href="../resources.html">Resources</a></p>
</div>

<nav class="toc" aria-label="Sections">
  <h2>On this page</h2>
  <ol>
    <li><a href="#about">How this course works</a></li>
    <li><a href="#outcomes">Course learning outcomes</a></li>
''')
for title, _desc, _mods in TRACKS:
    parts.append(f'    <li><a href="#{slug(title)}">{esc(title)}</a></li>\n')
parts.append('''    <li><a href="#dependencies">Track dependencies</a></li>
  </ol>
</nav>

<main id="main">

<section id="about" aria-labelledby="about-h">
  <h2 id="about-h">How this course works</h2>
  <p>This course pairs hands-on building with deliberate reflection. At every step you use AI to generate code, then you read it, question it, and understand it. The goal is not to produce software faster. It is to become the developer who can evaluate, fix, and extend what AI produces. Every module ends with a prompt-reflection exercise: a structured pause to consider what the AI did, why, and what you would change next time.</p>
  <p>Each module is an interactive slide deck with checkpoint quizzes, per-slide notes, optional narrated audio, and practical tasks; your progress is saved in your browser. Every deck also supports adjustable text size, full keyboard control, light and dark themes, screen-reader slide announcements, and honours a reduced-motion preference. Modules that have their own accessible text version are linked below.</p>
</section>

<section id="outcomes" aria-labelledby="outcomes-h">
  <h2 id="outcomes-h">Course learning outcomes</h2>
  <p>By the end of this course you will be able to:</p>
  <ol>
''')
for lo in COURSE_LOS:
    parts.append(f'    <li>{esc(lo)}</li>\n')
parts.append('  </ol>\n</section>\n')

for title, desc, mods in TRACKS:
    parts.append(f'\n<section id="{slug(title)}" aria-labelledby="{slug(title)}-h">\n')
    parts.append(f'  <h2 id="{slug(title)}-h">{esc(title)}</h2>\n')
    parts.append(f'  <p>{esc(desc)}</p>\n')
    for code, href, mdesc, planned in mods:
        info = LOS.get(code)
        mtitle = info["title"] if info else code
        cls = "module planned" if planned else "module"
        parts.append(f'  <div class="{cls}">\n')
        tag = '<span class="tag">Planned</span>' if planned else ''
        parts.append(f'    <h3>{esc(code)} &mdash; {esc(mtitle)}{tag}</h3>\n')
        parts.append(f'    <p class="desc">{esc(mdesc)}</p>\n')
        if info and info["los"]:
            parts.append('    <p class="lo-lead">By the end you will be able to:</p>\n    <ul>\n')
            for lo in info["los"]:
                parts.append(f'      <li>{esc(lo)}</li>\n')
            parts.append('    </ul>\n')
        parts.append('    <p class="links">')
        links = []
        if not planned:
            links.append(f'<a href="../{href}">Open the {esc(mtitle)} deck</a>')
        acc = ACCESSIBLE.get(info["file"]) if info else None
        if acc:
            links.append(f'<a href="{acc}">Accessible text version</a>')
        parts.append(' &nbsp;&middot;&nbsp; '.join(links) if links else 'Not yet available.')
        parts.append('</p>\n  </div>\n')
    parts.append('</section>\n')

parts.append('''
<section id="dependencies" aria-labelledby="dependencies-h">
  <h2 id="dependencies-h">Track dependencies</h2>
  <ul>
    <li>Track A (Foundations) comes first.</li>
    <li>Track B (Backend API) builds on Track A.</li>
    <li>Track C (Frontend) builds on Track A.</li>
    <li>Track D (Fullstack) requires both Track B and Track C.</li>
    <li>Track E (AI Agents &amp; Automation) builds on Track A.</li>
  </ul>
</section>

</main>

<footer class="doc">
  <p><a href="../index.html">&larr; Course home</a> &nbsp;&middot;&nbsp; Learning Web Development by Building with AI &nbsp;&middot;&nbsp; CC BY 4.0</p>
</footer>

</div>
</body>
</html>
''')

out = ROOT / "accessible" / "index.html"
out.write_text("".join(parts))
print("wrote", out, out.stat().st_size, "bytes")
