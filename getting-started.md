# Getting Started with openall

This guide walks you through installing openall, configuring it, and building your first intent-driven application.

---

## Prerequisites

Before you begin, make sure you have the following:

- **Node.js 18 or later** — [Download here](https://nodejs.org)
- **npm 8+** (comes with Node.js)
- **An LLM API key** — openall defaults to Anthropic Claude. Get a key at [console.anthropic.com](https://console.anthropic.com).
- **Git**

---

## Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/openall-ai/openall.git
cd openall
npm install
```

This installs dependencies for all workspaces (`core/`, `app/`, and `frontend/`) in one step.

---

## Configuration

Create a `.env` file in the root of the repository:

```bash
cp .env.example .env
```

Then open `.env` and set your API key:

```
ANTHROPIC_API_KEY=your_key_here
```

If you prefer a different LLM provider, see the configuration options in `core/` for how to swap the runtime adapter.

---

## Running the runtime

The `core` package is the heart of openall. It is the LLM runtime engine.

```bash
cd core
npm start
```

You should see the runtime initialize and report that it is ready to receive intent.

---

## Running the reference application

The `app` package contains a reference application built on the core runtime. It demonstrates what an intent-driven application looks like end-to-end.

```bash
cd app
npm start
```

---

## Running the frontend

The `frontend` package provides a browser-based interface for composing intent, observing execution, and inspecting state.

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Your first intent-driven application

Once the runtime and frontend are running, try the following:

1. Open the frontend in your browser.
2. In the intent input field, describe what you want the application to do in plain language. For example:

   > "When a new customer signs up, send them a welcome email, create an onboarding task, and log the event."

3. Submit the intent. The runtime will parse it, reason about the required steps, and execute them — without any application code.

4. Inspect the execution trace in the sidebar to see exactly how the LLM interpreted and acted on your intent.

---

## Next steps

- [How It Works](how-it-works.md) — Understand the core ideas behind the LLM-as-runtime model
- [Architecture](architecture.md) — Explore the structure of the codebase
- [Contributing](contributing.md) — Help build the future of software
