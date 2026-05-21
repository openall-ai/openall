# Getting Started with openall

openall runs in two modes: as a native **Electron desktop app** (app mode) or as a **browser app backed by a local server** (web mode). Choose whichever fits your use case.

---

## App mode (Electron desktop)

### Download and install

Download the latest release from the [Releases page](https://github.com/openall-ai/openall/releases):

- **macOS Apple Silicon:** `openall-x.x.x-arm64.dmg`
- **macOS Intel:** `openall-x.x.x.dmg`
- **Windows:** `openall x.x.x.exe` (portable, no installer required)

Run the file and launch openall. No Node.js or server setup needed — the entire backend runs in-process inside the app.

### First-time configuration

- **Windows:** should work, might prompt for security, just click continue.
- **Mac:**  Try to open the app normally (you will get an error saying the developer cannot be verified).
            Open System Settings > Privacy & Security. 
            Scroll down to the Security section and click Open Anyway next to the blocked app's name.

On first launch, openall will display a configuration window asking for:

- **Provider:** Select your LLM provider (currently OpenRouter)
- **API key:** Your [OpenRouter](https://openrouter.ai) API key (`sk-or-...`)
- **Model:** Select from the available models for your provider

Your API key is stored securely in your system keychain via the OS credential store — it is never written to disk in plain text.

Click **Save Configuration** to proceed. openall will load your previous session if one exists.

---

## Web mode (browser + local server)

### Prerequisites

- Node.js 24 or later ([download](https://nodejs.org))
- An [OpenRouter](https://openrouter.ai) API key
- Git

### Installation

```bash
git clone https://github.com/openall-ai/openall.git
cd openall
npm install
```

This installs dependencies for all workspaces (`core/`, `app/`, `frontend/`) in one step.

### Running the backend (NestJS)

```bash
cd core
npm run start:dev
```

The NestJS server starts on port 3000. It serves the WebSocket gateway at `/api/chat` and the REST API at `/api`. In development, it also watches for file changes and restarts automatically.

For production use:

```bash
npm run build && npm run start:prod
```

### Running the frontend (React / Vite)

In a second terminal:

```bash
cd frontend
npm run dev
```

The Vite dev server starts (typically on port 5173) and proxies `/api` requests to the NestJS backend on port 3000.

Open [http://localhost:5173](http://localhost:5173) in your browser.

### First-time configuration (web mode)

Same as app mode: on first load, openall will show the configuration window. Enter your OpenRouter API key and save.

---

## Using openall

Once configured, you will see the main interface: a floating chat input at the bottom of the screen and a collapsible sidebar navbar on the left.

**To interact with openall,** type your intent in natural language and press Enter (or click the send button). For example:

> "Create a contacts list with name, email, and phone. Add a few sample contacts."

openall will:

1. Send your message to the LLM via OpenRouter
2. The LLM will call `query_db` to create and populate a SQLite table
3. The LLM will call `attach_artifact` to render a HTML view of the data
4. A draggable, resizable window will appear with the rendered UI

**To interact with a rendered window,** click buttons or fill in form fields inside it. These actions call `doAction()` which sends the current window state and your interaction back to the LLM for further reasoning and updating.

**To reset all data** (chat history, open windows, application database), go to Settings via the sidebar and click **Reset app data**.

---

## Next steps

- [How It Works](how-it-works.md) — Understand the LLM-as-OS model
- [Architecture](architecture.md) — Explore the NestJS, React, and Electron layers
- [Contributing](contributing.md) — Help build the future of software
