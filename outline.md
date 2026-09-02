---
title: Learning Web Development
title_accent: by Building with AI
subtitle: A practical course in full-stack web development
tagline: Build real things. Read what the AI wrote. Understand every line.
---

## About

This course pairs hands-on building with deliberate reflection. At every step you use
AI to generate code — then you read it, question it, and understand it. The goal is
not to produce software faster. It is to become the developer who can evaluate, fix,
and extend what AI produces.

Every module ends with a **prompt reflection exercise** — a structured pause to
consider what the AI did, why, and what you would change next time.

## Outcomes

1. Explain how the web works — HTTP, DNS, status codes, request-response — and trace a request from browser to database
2. Use the terminal confidently: navigate the filesystem, compose shell pipelines, manage environment variables, and write shell scripts
3. Track and share code using Git and GitHub, including branching, pull requests, and publishing via GitHub Pages
4. Design relational database schemas, write SQL queries, apply constraints and JOIN operations, and manage schema evolution safely
5. Build a fully functional REST API from scratch using Node.js, Express, and PostgreSQL, with authentication via JWT
6. Apply prompt engineering strategies — Scaffold, Explain, Debug, Extend — to direct AI assistants effectively at each stage of development
7. Read and evaluate AI-generated code critically: identify patterns, security risks, and design tradeoffs rather than accepting output blindly
8. Deploy a working server-side application to a cloud platform with proper environment configuration and database integration

## Dependencies

- **A — Foundations** → **B — Backend API** and **C — Frontend** → **D — Fullstack**
- **A — Foundations** → **E — AI Agents & Automation**

## Start Here — Orientation {#start color=#56d4e4}

Read this before Track A — prompting mindset, reading habit, how this course works

### S0 — Start Here {file=start-here}

Prompting philosophy, good vs bad prompts, what AI gets wrong, the reading checklist, vibe coding debate

- Describe the AI-assisted development loop and identify where reading and understanding fit within it
- Distinguish between surface-level and directed AI use and explain why the distinction matters for long-term maintainability
- Write a scaffold prompt that includes stack context, state shape, API contract, error handling requirements, and constraints
- Identify the four prompt move types — Scaffold, Explain, Debug, Extend — and the appropriate situation for each
- List at least four failure modes of AI code generation and the corresponding strategy for catching each
- Apply the five-point reading checklist to evaluate any piece of AI-generated code

## Track A — Foundations {color=#3fb950}

Core concepts every web developer needs before writing a line of backend code

### A1 — How the Web Works {file=web-fundamentals-workshop}

HTTP request/response, status codes, DNS, browsers, JSON

- Trace what happens when a browser makes an HTTP request and receives a response
- Interpret HTTP status codes, methods, and headers in the context of real API calls
- Explain the role of DNS in resolving domain names to IP addresses
- Parse and construct JSON data structures used in API communication
- Distinguish between REST and non-REST API design approaches

### A2 — Terminal & Shell {file=shell-workshop}

Navigation, pipes, environment variables, aliases, scripting

- Navigate the filesystem and manage files and directories from the command line
- Compose shell pipelines using pipes, redirection, and chaining operators (&&, ||)
- Configure environment variables and apply the .env / .env.example pattern
- Write basic shell scripts with variables and exit codes
- Use curl and jq to make HTTP requests and process JSON responses from the terminal

### A3 — Git & GitHub {file=git-workshop}

Version control, commit, push, branches, PRs, GitHub Pages

- Explain the three-zone Git model: working tree, staging area, and commit history
- Apply the daily commit workflow: stage, commit, push to a remote repository
- Create and merge branches safely, resolving conflicts when they arise
- Collaborate using GitHub: open pull requests and review changes
- Configure .gitignore to protect sensitive and generated files from version control

### A4 — Database Concepts {file=database-workshop}

Tables, SQL, psql, primary keys, constraints, transactions

- Explain the relational model: tables, rows, columns, primary keys, and foreign keys
- Write SQL queries to create, read, update, and delete records
- Apply database constraints (NOT NULL, UNIQUE, CHECK, FK) to enforce data integrity
- Construct JOIN queries to retrieve related data from multiple tables
- Apply safe migration discipline: extend schemas without dropping existing data

### A5 — Document Databases & MongoDB {file=mongodb-workshop}

Collections, documents, Mongoose, embed vs reference, aggregation pipelines

- Explain the document model and contrast it with the relational model
- Design MongoDB schemas using Mongoose with appropriate field types and validation
- Perform CRUD operations on a MongoDB collection using Mongoose methods
- Choose between embedding and referencing related data in document schemas
- Construct basic aggregation pipelines to filter, group, and transform documents

### A6 — REST & HTTP APIs {file=rest-workshop}

Methods, URI design, status codes, statelessness, error design

- Explain the six REST constraints and their practical implications for API design
- Design clean, resource-oriented URI structures following REST conventions
- Select appropriate HTTP methods and status codes for each API operation
- Explain statelessness and its implications for session management and scalability
- Design consistent, informative error responses that distinguish client from server errors

## Track B — Backend API {color=#58a6ff}

Build a production-quality REST API from scratch using AI as your coding partner

> The Backend track forms the core of Part 1–4 series (B2–B5). Start with B1 (Prompt Engineering) before B2.

### B1 — Prompt Engineering {file=prompt-engineering-workshop}

Four prompt types: Scaffold, Explain, Debug, Extend

- Apply the four prompt types — Scaffold, Explain, Debug, Extend — to appropriate coding tasks
- Construct scaffold prompts that specify schema, environment, and security constraints
- Use explain prompts to interrogate AI-generated code and understand each design decision
- Apply debug prompts to diagnose errors systematically before requesting a fix
- Evaluate AI-generated security choices and identify decisions that require human scrutiny

### B2 — CRUD API with AI {file=ai-crud-workshop}

Node.js, Express, PostgreSQL, generated code walkthrough

- Use a scaffold prompt to generate a working Node.js / Express / PostgreSQL CRUD API
- Read and explain the purpose of every generated file, including package.json and db.js
- Apply parameterised queries to prevent SQL injection in AI-generated database code
- Identify and correct common AI mistakes: ES module paths, route ordering, dynamic PORT handling
- Deploy a Node.js API to Railway and configure environment variables for production

### B3 — Authentication {file=auth-workshop}

JWT, bcrypt, middleware, protected routes

- Explain how JWT works: structure (header, payload, signature), signing, and verification
- Implement user registration with bcrypt password hashing and safe, uniform error messages
- Build an Express authentication middleware that verifies JWTs and attaches the payload to req.user
- Protect routes by composing middleware and trace the full auth flow from request to response
- Apply JWT security best practices: secret management, token expiry, payload content, and revocation limitations

### B4 — Testing with curl {file=curl-testing-workshop}

curl, jq, scripted API test workflow

- Use curl to send HTTP requests and interpret response bodies, headers, and status codes
- Capture a JWT from a login response and use it in subsequent authenticated requests
- Write a shell script that runs a complete CRUD test sequence automatically
- Use jq to filter and extract data from JSON API responses in the terminal
- Diagnose common API failures — connection refused, 401, 404, 422 — using curl output alone

### B5 — Extending APIs {file=extending-api-workshop}

Pagination, relational data, JOIN queries

- Add offset pagination to an existing API endpoint using SQL LIMIT and OFFSET with a JSON envelope
- Construct window function queries to include total count without a second database round-trip
- Add a foreign-key relationship between two database tables with appropriate CASCADE rules
- Write JOIN queries to fetch related data across tables in a single database call
- Apply safe migration discipline: add tables and columns without modifying or dropping existing data

### B6 — Validation & Errors {file=validation-workshop}

Input validation, error middleware, Zod, asyncHandler

- Identify the four validation layers in a web application and explain why route-handler validation is essential
- Write manual validation checks for required fields, type, length, and allowed values in an Express route
- Create a centralised error-handling middleware and an AppError class that carries an HTTP status code
- Wrap async route handlers with asyncHandler to eliminate try/catch boilerplate
- Apply Zod schema validation with safeParse to parse and type-check request bodies in Express routes

### B7 — Deployment {planned}

Railway, env vars, Railway PostgreSQL, live testing

## Track C — Frontend {color=#bc8cff}

Build a React application that connects to your API

### C1 — React Fundamentals {file=react-fundamentals-workshop}

Components, JSX, props, useState, events, forms, lists

- Set up a Vite + React + TypeScript project and explain the purpose of each generated file
- Write function components with typed props using TypeScript interfaces
- Manage local component state with useState and explain why direct mutation does not work
- Build controlled form inputs using the value and onChange pattern
- Render lists using .map() with stable key props and explain why keys are required
- Apply conditional rendering using &&, ternary, and early return patterns
- Read and critically evaluate AI-generated React components

### C2 — State & Effects {file=state-effects-workshop}

useEffect, async fetch, cleanup, custom hooks, useMemo

- Explain what triggers a React re-render and why side effects must not run during render
- Use useEffect with the correct dependency array to control when effects run
- Write async fetch logic inside useEffect using the define-then-call async pattern
- Implement AbortController cleanup to prevent memory leaks on unmount
- Extract reusable stateful logic into a custom hook and explain the naming convention
- Recognise when useCallback and useMemo are and are not appropriate optimisations

### C3 — API Integration {file=api-integration-workshop}

CORS, env vars, Vite proxy, centralised api.ts, token storage

- Explain the same-origin policy and why a Vite dev server and an Express server require CORS configuration
- Configure the cors() middleware in Express with explicit origin, methods, and headers options
- Use VITE_ prefixed environment variables to configure the API base URL for development and production
- Set up a Vite proxy to forward /api requests to Express, eliminating CORS in development
- Build a centralised api.ts module with a generic request<T> function, Bearer token header, and global 401 handling
- Apply the token storage trade-offs between localStorage, sessionStorage, and httpOnly cookies
- Diagnose CORS and authentication errors using browser DevTools Network and Console panels

### C4 — Forms & Validation {file=forms-validation-workshop}

Controlled inputs, generic onChange, validation, aria-describedby

- Use controlled inputs with value and onChange to manage form field values in React state
- Manage multiple form fields with a single state object and a generic onChange handler that reads e.target.name
- Write async submit handlers with loading and error state, and a finally block that always re-enables the button
- Implement client-side validation and display per-field errors accessibly using aria-describedby and role="alert"
- Apply the correct TypeScript generics for FormEvent and ChangeEvent handlers
- Choose between submit-time and blur-time validation strategies and explain the trade-offs of each
- Use a useDebounce custom hook to rate-limit async validation effects and prevent redundant network calls

### C5 — Routing {file=routing-workshop}

React Router v6, Link, useParams, useNavigate, ProtectedRoute

- Explain client-side routing and how React Router intercepts navigation without a server round-trip
- Set up React Router v6 with BrowserRouter, Routes, and Route, and identify differences from v5 syntax
- Use Link for internal navigation and NavLink with active styling for nav bars
- Read URL parameters with useParams and include them correctly in useEffect dependency arrays
- Navigate programmatically with useNavigate after login, logout, and form submissions, using replace to prevent Back-button loops
- Structure shared UI with layout routes and Outlet, keeping shared components mounted across route transitions
- Build a ProtectedRoute component that redirects unauthenticated users before any API call is made, and explain why it is a UX guard rather than a security boundary

## Track D — Fullstack {color=#d29922}

Connect everything — requires Tracks B and C

### D1 — Connecting the Stack {file=fullstack-contracts-workshop}

Architecture, shared types, API contracts, production CORS, Express serving React

- Explain the development vs production fullstack architecture and why same-origin production eliminates client-side CORS
- Identify API contract mismatches between frontend and backend by comparing field names, wrapper objects, and error keys
- Create a shared/types.ts file as a single source of truth for request and response shapes
- Configure environment-based CORS using CLIENT_ORIGIN rather than a hardcoded origin string
- Add express.static and a catch-all GET * route in the correct order to serve a React production build from Express
- Run a local integration test to verify API and SPA routing both work on one port after building React

### D2 — Auth End-to-End {file=auth-end-to-end-workshop}

Register, login, useAuth hook, token lifecycle, logout

- Trace the complete auth flow across register, login, protected request, and logout, identifying what each operation stores and returns
- Implement a useAuth hook that updates both localStorage and React state atomically on login and logout
- Write a LoginPage that stores the token before navigating and shows a uniform error message that does not reveal which credential was wrong
- Diagnose the six common auth bugs: token key mismatch, wrong Bearer prefix, stale NavBar state, Back-button loop, registration token storage, and email enumeration
- Explain JWT expiry handling and why window.location.href is used instead of navigate in api.ts

### D3 — Build & Deploy {file=deploy-workshop}

npm run build, Railway, schema setup, env vars, live testing

- Explain what npm run build produces and why VITE_ variables are baked in at build time rather than read at runtime
- Apply the six-point pre-deploy checklist to identify common issues before pushing to Railway
- Set up a Railway project with a PostgreSQL plugin, configure environment variables, and trigger a deploy via GitHub push
- Run schema.sql against a Railway PostgreSQL database using the Railway CLI
- Test a live deployment in layers using curl before testing in the browser
- Diagnose the six most common Railway deploy failures from logs and error responses

## Track E — AI Agents & Automation {color=#ffa657}

Build autonomous workflows with n8n and large language model APIs

### E1 — What is an Agent? {file=ai-agents-workshop}

LLMs + tools + loops, ReAct pattern, agent vs chatbot

- Explain the four components of an AI agent: LLM, tools, memory, and objective
- Trace the ReAct loop (Reason → Act → Observe) through a concrete agent interaction
- Read function-calling code and identify the tool definition, call, and observation pattern
- Distinguish single-agent, multi-agent, and human-in-the-loop architectures and their trade-offs
- Identify the four common agent failure modes and describe how to mitigate each

### E2 — n8n Fundamentals {file=n8n-fundamentals-workshop}

Nodes, expressions, credentials, the item model

- Explain the node-and-connection model of n8n and describe what a trigger, action, logic, and AI node each do
- Describe the item model and explain why Split Out is needed when an API returns an array
- Write n8n expressions to reference data from the current item and from named nodes
- Configure HTTP Request nodes with Header Auth credentials to call a JWT-protected REST API
- Set up an AI Agent node with a model, system prompt, and tool nodes

### E3 — Calling APIs in n8n {file=n8n-api-workshop}

Login for JWT, full CRUD, data mapping, debugging errors

- Build an n8n workflow that authenticates against a JWT-protected REST API at runtime
- Carry a JWT through a multi-node workflow using named-node expressions
- Perform all four CRUD operations via HTTP Request nodes with expressions
- Use Set, Code, and Aggregate nodes to reshape and summarise item data between nodes
- Diagnose and fix the four most common n8n API errors: 401, 404, ECONNREFUSED, and expression errors

### E4 — AI Agent Node {file=n8n-agent-node-workshop}

Tool nodes, system prompts, memory, testing

- Explain what the AI Agent node does internally and how it implements the ReAct loop
- Configure tool nodes with names, descriptions, and schemas that enable accurate LLM tool routing
- Write a system prompt with explicit constraints that prevent common agent errors
- Connect Window Buffer Memory and Postgres Chat Memory and explain when to use each
- Use the n8n execution log to diagnose incorrect tool routing and hallucinated arguments

### E5 — Building Agents {file=n8n-building-agents-workshop}

Research, summarise & tag, monitor & notify

- Build a research agent that uses LLM knowledge to generate recommendations and deduplicates against a live API
- Build an idempotent batch-processing pipeline using IF node filtering and Basic LLM Chain
- Build a monitor-and-notify workflow using scheduled polling, Code node date arithmetic, and conditional alerting
- Chain two agents using a Set node to translate the first agent's output into the second agent's input
- Apply a reversibility framework to classify agent actions and determine appropriate human gate placement

### E6 — Production Patterns {file=n8n-production-workshop}

Error workflows, approval gates, monitoring, cost

- Set up an n8n Error Workflow that alerts on any execution failure with structured error context
- Configure retry logic appropriately for transient failures while avoiding retries on permanent errors
- Implement the Wait node approval pattern to pause a workflow pending human review
- Use the execution history panel to audit workflow runs and diagnose silent or partial failures
- Apply at least two cost management strategies to reduce LLM token consumption in a production workflow
