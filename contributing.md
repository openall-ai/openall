# Contributing to openall

Thank you for your interest in contributing. openall is an early-stage open-source project exploring a genuinely new paradigm for software. Contributions at every level are welcome: code, documentation, bug reports, ideas, and questions.

---

## Before you start

Read [How It Works](how-it-works.md) and [Architecture](architecture.md) before writing any code. Understanding the intent-first model is essential for writing contributions that fit the project's direction.

---

## Ways to contribute

**Bug reports**
If something doesn't work, open an issue. Include your Node.js version, your LLM provider, the intent you submitted, and the error or unexpected behavior you observed. Execution traces are especially helpful.

**Feature requests and ideas**
Open an issue with the label `idea`. Describe the use case, not just the feature. What intent would a user express? What should happen?

**Documentation**
Documentation improvements are always welcome. If something in the docs is unclear, incomplete, or wrong, open a PR.

**Code contributions**
See the process below.

---

## Development setup

```bash
git clone https://github.com/openall-ai/openall.git
cd openall
npm install
cp .env.example .env
# Add your ANTHROPIC_API_KEY to .env
```

To run the core runtime in development mode:

```bash
cd core && npm run dev
```

---

## Pull request process

1. **Open an issue first** for any non-trivial change. This avoids wasted effort if the direction isn't right for the project.

2. **Fork the repo** and create a branch from `main`:

   ```bash
   git checkout -b your-feature-name
   ```

3. **Write your code.** Follow the code style guidelines below.

4. **Test your changes.** The project is early-stage and the test suite is growing. At minimum, manually verify your change works end-to-end with a real LLM call.

5. **Update documentation** if your change affects behavior, configuration, or architecture.

6. **Open a pull request** against `main`. Include:
   - A clear description of what changed and why
   - A link to the related issue
   - An example of the intent that exercises your change, if applicable

---

## Code style

The project is written in TypeScript. A few guidelines:

- **Prefer explicit types** over inferred types in function signatures and public interfaces
- **Keep modules small and focused.** Each file should have a single, clear responsibility
- **No magic strings.** Use constants or enums for values that appear more than once
- **Write intent-forward code.** If someone reads your code and cannot understand what it is trying to do in 30 seconds, refactor it
- Formatting is handled by Prettier. Run `npm run format` before committing

---

## Commit messages

Use the conventional commits format:

```
type(scope): short description

Longer explanation if needed. What changed, why it changed.
```

Types: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`

Examples:
```
feat(core): add streaming support for LLM responses
fix(app): resolve state desync on concurrent intents
docs: expand architecture section on observability
```

---

## What we are not looking for

- Contributions that add application code to the `core` runtime (the whole point is that application code is not needed)
- Wrapping existing app frameworks and calling them openall
- Prompt engineering tricks presented as architecture
- Dependencies that compromise the runtime's provider-agnostic design

When in doubt, open an issue and ask before building.

---

## Code of conduct

Be direct. Be respectful. Engage with ideas, not personalities. This is a project about rethinking something fundamental — it will attract strong opinions. Strong opinions are welcome. Hostility is not.

---

## License

By contributing to openall, you agree that your contributions will be licensed under the same [PolyForm Noncommercial License](../LICENSE) that covers the project.