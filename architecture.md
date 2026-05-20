# Architecture

openall is a TypeScript monorepo with three primary packages: `core`, `app`, and `frontend`. This document describes how they fit together and what each one is responsible for.

---

## Repository structure

```
openall/
├── core/              # Runtime engine
│   └── ...            # LLM orchestration, state, tool execution, tracing
│
├── app/               # Reference application
│   └── ...            # Domain definitions, capability declarations, intent flows
│
├── frontend/          # Web UI
│   └── ...            # Intent authoring, execution trace viewer, state inspector
│
├── .github/
│   └── workflows/     # CI/CD pipelines
│
├── package.json       # Workspace root
└── LICENSE
```

Dependencies flow in one direction: `frontend` and `app` depend on `core`. `core` has no knowledge of either.

---

## The `core` package

`core` is the runtime engine. It is the only package that talks to the LLM directly.

**Responsibilities:**

- Receiving intent from any caller (the `app` package, external systems, the CLI)
- Assembling the execution context: current state, available tools, domain constraints
- Submitting intent and context to the configured LLM provider
- Parsing structured outputs from the LLM
- Dispatching tool calls and side effects
- Managing application state across turns
- Emitting execution traces for observability

**Key design decisions:**

- The LLM provider is pluggable. The interface is defined abstractly so any providers can be swapped in.
- Tool execution is synchronous within a turn and asynchronous across turns. The runtime resolves all tool calls before returning a result.
- State is explicit and inspectable. There is no hidden state inside the LLM. All state lives in a managed store that the LLM reads and writes via structured outputs.

---

## The `app` package

`app` is the reference application built on `core`. It demonstrates the openall model end-to-end.

**Responsibilities:**

- Defining the domain: entities, relationships, and business rules in natural language
- Declaring the capabilities available to the runtime: which APIs and integrations it can call
- Defining constraints: what the runtime is and is not permitted to do
- Serving as the entry point for intent from external callers

Think of `app` as the configuration and composition layer. It tells `core` what world it is operating in.

---

## The `frontend` package

`frontend` is a web UI for interacting with the runtime.

**Responsibilities:**

- Providing an intent authoring interface: a place to compose and submit intent in natural language
- Displaying execution traces: a step-by-step view of how the runtime interpreted and acted on intent
- Exposing the current state of the system: what entities exist, what their values are
- Surfacing errors and unexpected behaviors for debugging

---

## Data flow

A complete request cycle looks like this:

```
User input
    │
    ▼
frontend (intent authoring UI)
    │  HTTP / WebSocket
    ▼
app (entry point, domain definitions)
    │  Internal call
    ▼
core (runtime engine)
    │  API call
    ▼
LLM provider (Anthropic Claude or equivalent)
    │  Structured response
    ▼
core (parses output, dispatches tool calls, updates state)
    │  Trace + result
    ▼
frontend (execution trace viewer)
    │
    ▼
User
```

---

## LLM provider interface

The runtime communicates with the LLM through a provider interface defined in `core`. The default implementation targets the Anthropic Messages API.

The interface is responsible for:

- Formatting the context window: system prompt, domain definitions, state, tool schemas, intent
- Submitting the request and handling streaming or batched responses
- Parsing tool use blocks from the response
- Retrying on transient errors

Swapping to a different provider means implementing this interface, not changing the rest of the runtime.

---

## Observability

Every execution emits a structured trace containing:

- The raw intent that was received
- The assembled context that was sent to the LLM
- The full LLM response, including reasoning steps if available
- Each tool call dispatched, with inputs and outputs
- State before and after the execution
- Timing information for each step

Traces are surfaced in the `frontend` and can be exported for analysis.

---

## Monorepo tooling

The repository uses npm workspaces. To run commands across all packages:

```bash
# Install all dependencies
npm install

# Run a script in a specific package
npm run start --workspace=core

# Add a dependency to a specific package
npm install some-package --workspace=app
```

---

## Further reading

- [How It Works](how-it-works.md) — The conceptual model behind the architecture
- [Getting Started](getting-started.md) — Run the stack locally
- [Contributing](contributing.md) — How to extend and improve the architecture
