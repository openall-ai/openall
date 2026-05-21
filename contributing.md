# Contributing to openall

Thank you for your interest in contributing. openall is an early-stage open-source project exploring a genuinely new paradigm for software. Contributions at every level are welcome: code, documentation, bug reports, and ideas.

---

## Before you start

Read [How It Works](how-it-works.md) and [Architecture](architecture.md) before writing any code. Understanding the intent-first model and the NestJS/React/Electron stack is essential for contributions that fit the project's direction.

---

## Ways to contribute

**Bug reports**
Open an issue. Include your platform (web mode or Electron app), your Node.js version, your OpenRouter model, the message you sent, and the error or unexpected behavior. SQL queries logged in the message panel are especially useful.

**Feature requests and ideas**
Open an issue with the label `idea`. Describe the use case, not just the feature. What intent would a user express? What should happen?

**Documentation**
Documentation improvements are always welcome. If something is unclear, incomplete, or wrong, open a PR.

**Code contributions**
See the process below.

---

## Development setup

```bash
git clone https://github.com/openall-ai/openall.git
cd openall
npm install
```

### Running in web mode (recommended for development)

Terminal 1 — NestJS backend with file watching:

```bash
cd core
npm run start:dev
```

Terminal 2 — React frontend with HMR:

```bash
cd frontend
npm run dev
```

Open [http://localhost:5173](http://localhost:5173). The Vite dev server proxies `/api` and `/api/chat` to the NestJS backend automatically.

### Running in Electron (app mode)

First build the frontend and core:

```bash
cd frontend && npm run build
cd ../core && npm run build
```

Then launch the Electron app:

```bash
cd app && npm start
```

---

## Project structure to know

- **`core/src/chat/chat.service.ts`** — the most important file. LLM call loop, tool execution, state management. Most backend contributions touch this.
- **`core/src/chat/chat.gateway.ts`** — WebSocket event routing. Add new event types here when extending the protocol.
- **`frontend/src/chat-box.tsx`** — `CounterStore` is the central MobX store. Most frontend state flows through here.
- **`frontend/src/connectivity/connection.ts`** — the transport abstraction. Any new message types need a corresponding method here (with both WebSocket and IPC branches).
- **`app/electron/main.js`** — when adding new IPC handlers for new gateway methods, register them here.

---

## Pull request process

1. **Open an issue first** for any non-trivial change. This avoids wasted effort if the direction is not right.

2. **Fork the repo** and create a branch from `main`:

   ```bash
   git checkout -b your-feature-name
   ```

3. **Write your code.** See code style guidelines below.

4. **Test your change end-to-end.** The test suite is nascent. At minimum, test manually in both web mode and Electron app mode if your change touches the transport layer or the NestJS/Electron boundary.

5. **Update documentation** if your change affects behavior, the WebSocket protocol, or the architecture.

6. **Open a pull request** against `main`. Include a clear description, a link to the related issue, and an example message that exercises your change.

---

## Code style

The project is TypeScript throughout. A few guidelines:

**NestJS / core:**
- Follow NestJS module conventions — services, gateways, and entities in their own files, grouped by feature module
- New capabilities exposed to the LLM go in `chat.service.ts` as tool definitions (alongside `openHtmlViewTool` and `queryDatabase`)
- New persistent state goes in a TypeORM entity inside the relevant module's `entities/` folder
- Format with Prettier: `npm run format` inside `core/`

**React / frontend:**
- New observable state goes in an appropriate MobX store (global app state in `CounterStore`, UI focus state in `ActiveWindowStore`, isolated feature state in its own store)
- Components that read from MobX stores must be wrapped with `observer()` from `mobx-react-lite`
- New message types sent to the backend must be handled in both branches of `Connection` (WebSocket path and IPC path)
- Styling uses Tailwind CSS v4 utility classes only — no custom CSS files

**General:**
- Prefer explicit TypeScript types in function signatures and public interfaces
- No magic strings — use constants for event names and entity column names that appear more than once

---

## Commit messages

Use the conventional commits format:

```
type(scope): short description

Longer explanation if needed. What changed, why.
```

Types: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`

Scopes: `core`, `frontend`, `app`, `docs`

Examples:
```
feat(core): add support for file attachment tool
fix(frontend): restore minimized windows on reconnect
docs: add web mode vs app mode section to architecture
chore(app): update Electron to 43.x
```

---

## What we are not looking for

- Contributions that add traditional application code to replace the LLM's role in the runtime
- Wrapping existing app frameworks under the openall namespace
- Hardcoded schemas in `apps.sqlite` — that database belongs to the LLM
- Dependencies that couple the core to a specific LLM provider (the OpenRouter integration should remain the abstraction boundary)

When in doubt, open an issue and ask before building.

---

## License

By contributing to openall, you agree that your contributions will be licensed under the same [PolyForm Noncommercial License](../LICENSE) that covers the project.

---

## Code of conduct

Be direct. Be respectful. Engage with ideas, not personalities. This is a project about rethinking something fundamental — strong opinions are welcome. Hostility is not.
