<div align="center">

# ◇ openall
<sub>openall is a manifesto in action. The translation layer is gone.</sub>

</div>

---

Every application ever built is a translation layer. A human has intent. A developer or LLM writes code to express it. A machine executes the code. The intent was never the program — the code was.

**openall removes the translation layer entirely.**

There is no application code. The LLM is the runtime. Your intent, expressed in natural language, is the program. The machine acts directly.

This is not a chatbot wrapper. This is a new architecture for software.

---

## What openall is

openall is an open-source framework for building **intent-driven applications** where:

- Business logic lives in natural language, not code
- A language model interprets and executes that logic at runtime, querying and updating a SQLite database it manages itself
- The LLM renders UI as HTML artifacts, displayed as draggable floating windows
- Domain experts can build and modify applications without writing a single line of application code

## What openall is not

- It is not a prompt engineering toolkit
- It is not a chatbot or assistant framework
- It is not a low-code wrapper around existing app paradigms
- It is not finished — it is an open frontier

---

## Two ways to run openall

**App mode (Electron desktop app):** Download and run the native desktop app. The NestJS core runs in-process inside Electron — no server to manage, no ports to configure. Available for macOS (Apple Silicon and Intel) and Windows.

**Web mode (browser + server):** Run the NestJS backend as a standalone HTTP/WebSocket server and open the React frontend in any browser. Good for development, self-hosting, or server deployments.

---

## Quick start

### App mode (Electron)

Download the latest release from [Releases](https://github.com/openall-ai/openall/releases) and run the installer for your platform.

On first launch, openall will prompt you to configure an LLM provider and API key.

---

## Repository structure

```
openall/
├── core/          # NestJS backend — LLM orchestration, WebSocket gateway, SQLite state
├── app/           # Electron shell — packages core + frontend into a native desktop app
├── frontend/      # React + MobX frontend — chat UI, draggable artifact windows
├── docs/          # Documentation
└── LICENSE
```

See [Architecture](docs/architecture.md) for a full breakdown.

---

## Tech stack

| Layer | Technology |
|---|---|
| Backend | NestJS 11, TypeORM, SQLite, WebSockets |
| Frontend | React 19, MobX 6, Tailwind CSS v4, Vite 8 |
| Desktop | Electron 42 |
| LLM provider | OpenRouter (model-agnostic) |

---

## Documentation

| Guide | Description |
|---|---|
| [Getting Started](docs/getting-started.md) | Install, configure, and run your first intent-driven session |
| [How It Works](docs/how-it-works.md) | The core idea: LLM as OS, intent as program |
| [Architecture](docs/architecture.md) | NestJS core, React/MobX frontend, Electron shell, web vs app mode |
| [Contributing](docs/contributing.md) | How to contribute, code standards, PR process |

---

## License

openall is released under the [PolyForm Noncommercial License 1.0.0](LICENSE).

Commercial use requires a separate agreement. If you are building something commercial on top of openall, [reach out](https://github.com/openall-ai/openall/issues).

---


