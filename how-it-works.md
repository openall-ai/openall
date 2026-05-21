# How openall Works

## The problem with traditional software

Every piece of software ever written is a translation layer.

A human has intent — a goal, a workflow, a business rule. To act on that intent, a developer or an LLM must translate it into code. The code is then compiled or interpreted into machine instructions. The machine finally acts.

This pipeline has served us well for decades. But it is lossy at every step:

- Intent is ambiguous, requirements documents are incomplete
- Code is rigid, changing intent means rewriting code
- The gap between what was intended and what was built is a permanent source of bugs, delays, and cost

Modern language models change the equation. They are capable of understanding intent expressed in natural language, reasoning about what needs to happen, and producing structured outputs — all at runtime, without pre-written application code.

openall builds on this capability and takes it to its logical conclusion: the LLM is not a tool the application uses. **The LLM is the application.**

---

## The LLM as operating system

openall gives the LLM two tools and a database, then gets out of the way:

**`query_db`** — executes any SQLite query against a live application database. The LLM uses this to create tables, insert data, update records, and read state. There is no predefined schema. The LLM invents and evolves the schema as needed to fulfill the user's intent.

**`attach_artifact`** — renders a HTML view inside a draggable floating window in the UI. The LLM uses this to display data, forms, lists, dashboards, and any other interface needed. The HTML is Tailwind-styled and can call `doAction()` on user interactions, which routes clicks and form inputs back to the LLM for further reasoning.

The LLM's system prompt frames this explicitly: it is role-playing as an operating system. The user's natural language messages are the program.

---

## A complete request cycle

Here is what happens when a user types a message:

**1. Message arrives**
The user types intent in natural language. The frontend sends it to the NestJS backend over WebSocket (web mode) or Electron IPC (app mode).

**2. Chat history is assembled**
The backend loads the last 30 messages from SQLite and reconstructs the conversation. The LLM always has full context of the current session.

**3. LLM reasoning loop**
The backend calls the OpenRouter API with:
- The system prompt (LLM-as-OS role)
- The currently open windows (their IDs and titles, so the LLM can update existing windows instead of always creating new ones)
- The full conversation history
- The two tool definitions

The LLM reasons over the intent and decides what to do.

**4. Tool execution**
If the LLM calls `query_db`, the backend executes the SQL against the apps database and returns the result. If the LLM calls `attach_artifact`, the backend saves the HTML content to the window state database and pushes a `ui` event to the frontend. The loop runs up to 10 times to handle multi-step reasoning (for example: create a table, then query it, then render the results).

**5. UI update**
The frontend receives `ui` events and renders the HTML content inside a new or updated draggable window. The window is interactive immediately.

**6. User interaction**
When the user interacts with a rendered window (clicking a button, submitting a form), the frontend calls `doAction()`. This sends the active window ID, current form input values, and the action arguments back to the backend. The LLM reasons over the action and updates the window accordingly.

---

## State management

openall maintains two SQLite databases:

**`chat.sqlite`** — owned by the framework. Stores chat message history, open window state (HTML content, title, position), and LLM provider configuration. This persists across sessions and is restored automatically on reconnect.

**`apps.sqlite`** — owned by the LLM. This is a blank database that the LLM creates and manages entirely through `query_db`. It has no predefined schema. The LLM creates tables as needed and populates them with real data before rendering any UI. If data is not in the database, the LLM is instructed to add it first, so the UI always reflects persisted state rather than in-memory fabrication.

In Electron app mode, both databases are stored at `~/.openall/data/`. In web mode, they are stored at `./data/` relative to where the core server is running.

---

## The transport layer abstraction

The frontend's `Connection` class detects its environment at startup:

- If `window.api` is defined (Electron), it uses Electron IPC (`ipcRenderer.invoke`) to communicate with the NestJS core running in the main process.
- If `window.api` is not defined (browser/web mode), it opens a WebSocket connection to `/api/chat` on the NestJS server.

The rest of the frontend is identical in both modes. This means the same React/MobX codebase works as both a desktop app and a web app with no conditional rendering or environment-specific logic above the connection layer.

---

## Tradeoffs and open questions

openall is an experiment at the frontier. There are genuine tradeoffs:

**Determinism:** LLM reasoning is probabilistic. The same intent may produce different results on different runs. This is a real characteristic of the system, not a bug to be hidden. Observability (the message log, the SQL queries logged in real time) is a first-class feature.

**Schema stability:** Because the LLM owns the apps database schema, schema changes can happen implicitly as intent evolves. This is a feature (flexibility) and a risk (data integrity). It is an open area of development.

**Latency:** Multi-step tool use (create table, query, render) can require several round-trips to the LLM. The current loop cap is 10 iterations per message.

**Cost:** LLM API calls are metered per token. Sessions with complex multi-tool flows consume more tokens. The choice of model via OpenRouter lets operators balance cost and capability.

---

## Further reading

- [Architecture](architecture.md) — How the NestJS, React, and Electron layers are structured
- [Getting Started](getting-started.md) — Run your first session
