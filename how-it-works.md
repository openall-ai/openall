# How openall Works

## The problem with traditional software

Every piece of software ever written is a translation layer.

A human has intent - a goal, a workflow, a business rule. To act on that intent, a developer must translate it into code. The code is then compiled or interpreted into machine instructions. The machine finally acts.

This pipeline has served us well for decades. But it is lossy at every step:

- Intent is ambiguous, requirements documents are incomplete
- Code is rigid, changing intent means rewriting code
- Only developers used to participate in this process
- Vibe coding introduced coding to common people
- The gap between what was intended and what was built is a permanent source of bugs, delays, and cost

Modern language models change the equation. They are capable of understanding intent expressed in natural language, reasoning about what needs to happen, and producing structured outputs — all at runtime, without pre-written application code.

openall builds on this capability and takes it to its logical conclusion.

---

## The openall model

In openall, the architecture is inverted:

| Traditional software | openall |
|---|---|
| Intent → Code → Runtime → Action | Intent → Runtime → Action |
| Logic lives in code files | Logic lives in natural language |
| Developers write business rules | Domain experts express business rules |
| Rigid at deploy time | Adaptive at runtime |
| Requires a code change to update behavior | Requires an intent change to update behavior |

The LLM is not a tool the application uses. **The LLM is the application.**

---

## The execution model

When a user or system submits intent to openall, the following happens:

**1. Intent ingestion**
The input arrives as natural language. It may be a user action, a scheduled trigger, an external event, or a system-generated prompt.

**2. Context assembly**
The runtime assembles the relevant context: current state, available tools and capabilities, any domain definitions or constraints the operator has configured.

**3. LLM reasoning**
The language model receives the intent and context. It reasons about what needs to happen, in what order, and with what parameters. This is not a fixed decision tree — it is live reasoning over the specific situation.

**4. Structured execution**
The LLM create a structured output and executes it.


---

## What replaces application code

In a traditional application, developers or LLMs write code:

- **Routing logic** — which handler runs for which input
- **Business rules** — what should happen and under what conditions
- **State transitions** — how the system moves from one state to another
- **Validation** — whether an input or action is acceptable
- **Error handling** — what to do when something goes wrong

In openall, all of these responsibilities shift to the LLM:

- **Routing** is handled by the LLM interpreting the intent
- **Business rules** are expressed in natural language by domain experts and embedded in the LLM context
- **State** is managed by the LLM
- **Validation** is a reasoning step, not a hardcoded check
- **Error handling** is part of the LLM's reasoning about what to do when things go wrong

---

## What you do provide

openall does not mean there is nothing to configure. Operators provide:

- **Domain definitions** — the entities, relationships, and rules that define your domain, expressed in natural language
- **Capability declarations** — the tools, APIs, and integrations available to the LLM
- **Constraints** — what the LLM is and is not allowed to do

This is the authoring surface of openall. It is not code. It is intent, structured enough for the runtime to reason over.

---

## Tradeoffs and open questions

openall is an experiment at the frontier. There are genuine tradeoffs:

**Determinism:** LLM reasoning is probabilistic. openall takes this seriously and is designed with observability and auditability as first-class concerns, not as afterthoughts.

**Latency:** LLM inference is slower than compiled code execution. This is a real constraint and one the project is actively working on through caching and pre-reasoning.

**Cost:** LLM API calls have a cost per token. The architecture is designed to minimize unnecessary inference while maximizing the expressiveness of intent.

**Trust boundaries:** Not all business logic should be delegated to a probabilistic model. openall is not the right architecture for safety-critical systems where deterministic behavior is a hard requirement. It is the right architecture for adaptive, human-centered systems where flexibility and expressiveness matter most.

---

## Further reading

- [Architecture](architecture.md) — How the codebase is structured
- [Getting Started](getting-started.md) — Run your first intent-driven application
