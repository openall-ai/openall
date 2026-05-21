# Changelog

All notable changes to openall will be documented here.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). openall uses [semantic versioning](https://semver.org/).

---

## [Unreleased]

---

## [0.2.0] - 2026-05-20

### Added
- Electron desktop app with native builds for macOS (Apple Silicon and Intel) and Windows
- In-process NestJS bootstrap (`in-proc.ts`) for Electron — no HTTP server required in app mode
- Electron IPC bridge via `contextBridge` (`preload.mjs`) exposing `chat`, `config`, `connect`, `close`, `doAction`, `sendMessage`, `onMessage`
- Dual-mode transport in the frontend (`connection.ts`) — automatically uses Electron IPC when `window.api` is present, WebSocket otherwise
- MobX-powered state management across all frontend stores (`CounterStore`, `ActiveWindowStore`, `ConfigStore`, `ConnectionStatus`)
- Draggable, resizable artifact windows rendered from LLM-generated HTML (`DraggableWindow`)
- Window minimize/restore with a minimized window dock (`MinimizedList`)
- Collapsible sidebar navbar
- Settings panel with editable system prompts and data reset
- Two SQLite databases: `chat.sqlite` (framework-owned) and `apps.sqlite` (LLM-owned schema)
- API key storage via OS keychain (`keytar`)
- GitHub Actions CI building DMG (arm64 + Intel) and Windows EXE on every push to `main`

---

## [0.1.0] - Initial

### Added
- NestJS core with `ChatGateway` (WebSocket) and `ChatService`
- `attach_artifact` tool: LLM renders Tailwind HTML views as floating windows
- `query_db` tool: LLM creates and queries its own SQLite schema
- OpenRouter integration for model-agnostic LLM access
- React 19 frontend with Vite 8
- Chat history persistence and session restore on reconnect
- `doAction()` global function bridging LLM-rendered UI interactions back to the LLM reasoning loop

---

<!-- Add new entries at the top of the Unreleased section. -->
<!-- Format: Added / Changed / Deprecated / Removed / Fixed / Security -->
