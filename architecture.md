# Architecture

openall is a TypeScript monorepo with three packages: `core` (NestJS backend), `frontend` (React + MobX), and `app` (Electron shell). This document describes each layer, how they connect, and the key distinction between web mode and app mode.

---

## Repository structure

```
openall/
├── core/                          # NestJS backend
│   └── src/
│       ├── main.ts                # Web mode entry point (HTTP + WebSocket server)
│       ├── in-proc.ts             # App mode entry point (no HTTP server, context only)
│       ├── app.module.ts          # Root NestJS module
│       ├── chat/
│       │   ├── chat.gateway.ts    # WebSocket gateway — receives client events
│       │   ├── chat.service.ts    # Core logic — LLM calls, tool execution, state
│       │   ├── chat.module.ts
│       │   └── entities/          # TypeORM entities (ChatMessage, WindowState, ChatConfig)
│       └── state/
│           ├── database.service.ts  # Apps SQLite database (LLM-owned schema)
│           └── state.module.ts
│
├── app/                           # Electron shell
│   └── electron/
│       ├── main.js                # Electron main process — bootstraps core in-proc, IPC bridge
│       └── preload.mjs            # Exposes IPC API to renderer via contextBridge
│
├── frontend/                      # React + MobX frontend
│   └── src/
│       ├── App.tsx                # Root component
│       ├── chat-box.tsx           # CounterStore (central MobX store), ChatBox, WindowList
│       ├── draggable-window.tsx   # DraggableWindow component, ActiveWindowStore
│       ├── navbar.tsx             # Sidebar navigation
│       ├── connectivity/
│       │   └── connection.ts      # Dual-mode transport (WebSocket or Electron IPC)
│       ├── config/
│       │   └── config-box.tsx     # Provider/API key configuration UI, ConfigStore
│       └── settings/
│           └── settings-box.tsx   # Prompt editor, reset data
│
├── .github/workflows/
│   └── build-and-release.yaml    # CI: builds DMG (arm64 + Intel) and Windows EXE
│
└── package.json                   # npm workspace root
```

---

## Web mode vs app mode

openall runs in two fundamentally different configurations depending on the entry point used.

### Web mode

Entry point: `core/src/main.ts`

```
Browser (React/Vite)
      |
      | WebSocket (/api/chat) + HTTP (/api)
      |
NestJS server (port 3000)
      |
      | HTTP (OpenRouter API)
      |
LLM provider
```

NestJS starts as a full HTTP and WebSocket server via `NestFactory.create`. The frontend connects using the browser's native `WebSocket` API. The Vite dev server proxies `/api` and `/api/chat` to `localhost:3000` so the frontend can run on a different port without CORS issues.

NestJS also serves the compiled frontend static files via `ServeStaticModule`, so in production a single `npm run start:prod` on the core package serves the entire application.

### App mode (Electron)

Entry point: `core/src/in-proc.ts` (called from `app/electron/main.js`)

```
React frontend (renderer process, loads frontend/dist/index.html)
      |
      | Electron IPC (ipcRenderer.invoke / ipcMain.handle)
      |
Electron main process
      |
      | Direct in-process call (no HTTP, no WebSocket)
      |
NestJS ApplicationContext (core)
      |
      | HTTP (OpenRouter API)
      |
LLM provider
```

In app mode, `NestFactory.createApplicationContext` boots NestJS without starting any HTTP or WebSocket server. The Electron main process resolves `ChatGateway` from the NestJS DI container and wires its methods directly to IPC handlers. The renderer process communicates via `ipcRenderer.invoke` through the preload bridge.

This means there is no network socket involved in the critical path. The NestJS service layer runs in the same process as Electron, which enables native OS integrations (keychain access via `keytar`, data directory at `~/.openall/data/`).

The database path changes based on environment:

```typescript
const isElectron = !!process.versions.electron;
const dataDir = isElectron ? join(os.homedir(), '.openall/data') : 'data';
```

---

## The `core` package — NestJS backend

**Tech: NestJS 11, TypeORM, SQLite, `ws` WebSocket adapter, OpenRouter API**

### Modules

**`AppModule`** — root module. Imports `ChatModule`, `StateModule`, `TypeOrmModule` (two SQLite connections), `ServeStaticModule`, and `HttpModule`.

**`ChatModule`** — contains `ChatGateway` and `ChatService`. Owns the `ChatMessage`, `WindowState`, and `ChatConfig` TypeORM entities.

**`StateModule`** — contains `DatabaseService`. Owns the apps data source (the LLM-managed SQLite database).

### `ChatGateway`

A NestJS WebSocket gateway (`@WebSocketGateway`) listening at path `/api/chat`. Receives and dispatches the following events from connected clients:

| Event | Description |
|---|---|
| `chat` | New user message — triggers LLM reasoning loop |
| `doAction` | User interacted with a rendered window — sends window state and action args to LLM |
| `config` | Save LLM provider and API key |
| `close` | Close a rendered window |
| `resetData` | Delete all chat history, window state, and app database |
| `loadModels` | Request available models from the configured provider |

In web mode, `ChatGateway` receives events directly via WebSocket. In app mode, its methods are called directly by the Electron main process IPC handlers.

### `ChatService`

The core of openall. Responsible for:

- **Session initialization:** On client connect, checks for an existing config. If found, replays chat history and restores open windows. If not found, sends `showConfig` to prompt setup.
- **LLM reasoning loop:** Assembles the conversation history, currently open windows summary, and system prompt, then calls the OpenRouter API. Handles tool calls iteratively (up to 10 iterations per message).
- **Tool execution:** Dispatches `query_db` calls to `DatabaseService` and `attach_artifact` calls to window state persistence + frontend push.
- **State persistence:** Saves chat messages and window state to `chat.sqlite` via TypeORM repositories.
- **API key management:** Reads and writes API keys via `keytar` (system OS keychain).

### LLM integration

`ChatService` calls the OpenRouter API (`https://openrouter.ai/api/v1/chat/completions`) directly via `fetch`. The request includes:

- A system prompt that frames the LLM as an operating system
- A second system message listing currently open windows (IDs and titles)
- The full conversation history (last 30 messages)
- Two tool definitions: `attach_artifact` and `query_db`

Tool responses are handled in a loop: if the LLM response has `finish_reason: "tool_calls"`, tools are executed and results fed back into the messages array before the next LLM call.

### Two SQLite databases

**`chat.sqlite`** — framework-owned. Three TypeORM entities:

- `ChatMessageEntity` — stores conversation history (role, content, timestamp)
- `WindowStateEntity` — stores open window state (title, HTML content, soft-delete via `DeleteDateColumn`)
- `ChatConfigEntity` — stores LLM provider selection

**`apps.sqlite`** — LLM-owned. No predefined entities. The LLM creates and manages its own schema entirely through `query_db` tool calls. `DatabaseService` exposes a raw `query(sql)` method and a `dropDb()` method (used by reset).

---

## The `app` package — Electron shell

**Tech: Electron 42, electron-builder**

`app/electron/main.js` is the Electron main process entry point. On startup it:

1. Calls `bootstrap()` from `@openall-ai/core/dist/in-proc.js` to start NestJS as an application context
2. Resolves `ChatGateway` from the NestJS DI container
3. Registers `ipcMain.handle` handlers that call gateway methods directly
4. Creates a `BrowserWindow` and loads `../frontend/dist/index.html`

The `client` object passed to gateway methods wraps `mainWindow.webContents.send('ws:event', ...)` so events pushed by `ChatService` reach the renderer via IPC rather than WebSocket.

`app/electron/preload.mjs` uses `contextBridge.exposeInMainWorld` to expose the IPC API to the renderer as `window.api`, with methods: `chat`, `config`, `connect`, `close`, `doAction`, `sendMessage`, `onMessage`.

electron-builder packages the app for macOS (DMG, arm64 and x64) and Windows (portable EXE). The built frontend (`frontend/dist`) and a PNG icon are included as `extraResources`.

---

## The `frontend` package — React + MobX

**Tech: React 19, MobX 6, mobx-react-lite, Tailwind CSS v4, Vite 8**

### Transport layer

`connectivity/connection.ts` contains the `Connection` class, which detects its mode at startup:

```typescript
const api = (window as any).api;
if (api) {
    // App mode: use Electron IPC via preload bridge
    api.onMessage(callback);
    await api.connect();
} else {
    // Web mode: use native WebSocket
    this.ws = new WebSocket('/api/chat');
}
```

All subsequent operations (`sendChat`, `closeWindow`, `saveConfig`, `doAction`, `sendMessage`) branch the same way. The rest of the application has no awareness of which transport is in use.

`ConnectionStatus` is a MobX-observable class tracking `connected` and `connecting` state, reflected in the chat input's visual appearance.

### MobX stores

**`CounterStore`** (`chat-box.tsx`) — the central application store. Manages:
- `messages` — chat history displayed in the message panel
- `windows` — array of open artifact windows (each with id, title, HTML content, minimized state, inputs, loading state)
- `showConfig` / `showSettings` — modal visibility flags
- `initialized` — whether the session has been initialized (controls navbar and chat UI visibility)
- `prompts` — the current system prompts (editable in Settings)
- All WebSocket/IPC message handling via `onWebsocketMessage`

**`ActiveWindowStore`** (`draggable-window.tsx`) — tracks which window currently has focus (`activeWindow: number | null`). Used to route `doAction()` calls to the correct window and apply active window styling.

**`ConfigStore`** (`config/config-box.tsx`) — manages the configuration form state: selected provider, API key, models loaded flag.

**`ConnectionStatus`** (`connectivity/connection.ts`) — observable connection state used to style the chat input.

### Key components

**`ChatBox`** — the floating chat input bar at the bottom center of the screen. Also renders the message history panel (visible on focus) and contains `WindowList`.

**`WindowList`** — renders all open, non-minimized artifact windows by mapping `counterStore.windows` to `DraggableWindow` instances.

**`DraggableWindow`** — a floating, draggable, resizable window implemented with pointer events. Supports minimize, close, and resize handles. Renders LLM-generated HTML content via `dangerouslySetInnerHTML`. The `doAction()` global function is attached to `window` so LLM-generated HTML button click handlers can trigger backend calls without any script tags in the artifact.

**`MinimizedList`** — a fixed dock in the bottom-right corner showing minimized windows with restore and close controls.

**`Navbar`** — a collapsible sidebar on the left edge with workspace navigation items (Dashboard, Projects, Documents, Settings). Expands on hover.

**`ConfigBox`** / **`SettingsBox`** — rendered as modal `DraggableWindow` instances. ConfigBox handles initial provider setup. SettingsBox exposes the system prompts (editable in-place) and the data reset action.

---

## CI/CD

`.github/workflows/build-and-release.yaml` runs on every push to `main` and on manual dispatch. It builds for three targets in parallel:

| Platform | Runner | Output |
|---|---|---|
| macOS Apple Silicon | `macos-latest` | `openall-x.x.x-arm64.dmg` |
| macOS Intel | `macos-15-intel` | `openall-x.x.x.dmg` |
| Windows | `windows-latest` | `openall x.x.x.exe` (portable) |

Build order per platform: install workspace deps → build frontend → build core → build app. Artifacts are uploaded via `actions/upload-artifact`.

Linux is supported by electron-builder (AppImage target) but is not currently in the CI matrix.

---

## Further reading

- [How It Works](how-it-works.md) — The conceptual model: LLM as OS, tools, and the reasoning loop
- [Getting Started](getting-started.md) — Run the stack locally
- [Contributing](contributing.md) — How to extend and improve the codebase
