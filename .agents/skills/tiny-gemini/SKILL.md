---
name: tiny-gemini
description: tiny-gemini — Ask Gemini for text or send raw API calls via the npx CLI. Use when asking questions, summarizing files, extracting structured data, web-grounded answers, or raw API access. Not for images, audio, deep research, or model lookup.
allowed-tools: Bash, Read
---

# tiny-gemini — Core (text Q&A, search, raw API)

Zero-dependency CLI for the Google Gemini API. Requires Node.js >= 18 and npx. This is the **core** skill of the tiny-gemini suite — it owns text Q&A, search-grounded answers, the raw JSON passthrough, and all cross-cutting setup.

## Suite Members

This skill is the entry point. Other capabilities live in dedicated satellite skills (auto-installed via `dependencies`):

| Capability | Skill | Trigger phrases |
|------------|-------|-----------------|
| **Text Q&A, summarize, extract, search-grounded, raw JSON** | `tiny-gemini` (this skill) | "ask Gemini", "summarize", "extract structured data", "search the web", "send raw JSON" |
| **Image generation, editing, understanding** | `tiny-gemini-image` | "generate / make / create image", "edit photo", "describe image", "icon", "diagram", "pattern" |
| **Text-to-speech (WAV)** | `tiny-gemini-tts` | "speak this", "convert to speech", "narrate", "read aloud" |
| **Text/image → video generation and editing (MP4)** | `tiny-gemini-video` | "generate / make a video", "animate this photo", "edit / restyle this video" |
| **Multi-minute Deep Research agents** | `tiny-gemini-research` | "research X in depth", "comprehensive analysis", "multi-minute report" |
| **Offline model registry, pricing, deprecations** | `tiny-gemini-models` | "what Gemini models exist", "how much does X cost", "which model should I use" |

If a user prompt belongs to a sibling skill, **don't try to handle it from here** — the sibling will auto-invoke on its own description.

## API Key Setup

`tiny-gemini` needs a Google Gemini API key for any command that calls the API (the `models` command is offline and needs none). **Key management is owned by the CLI — there is nothing to configure at the skill level, and no skill stores the key.** The CLI resolves it in this order:

`--api-key` flag > `TINY_GEMINI_API_KEY` > `GEMINI_API_KEY` > `GOOGLE_API_KEY` > `.gemini/.env` (searching up from the working directory) > `~/.gemini/.env`.

Get a free key at https://aistudio.google.com/app/apikey, then make it available any of these ways:

```bash
export GEMINI_API_KEY="your-key-here"                                       # shell / CI
mkdir -p ~/.gemini && echo 'GEMINI_API_KEY=your-key-here' > ~/.gemini/.env  # user-global file (Gemini CLI convention)
npx tiny-gemini --api-key=your-key-here "Hello"                             # one-off flag
```

**If a command reports no key:** in an interactive terminal the CLI prompts and saves the key to `~/.gemini/.env`; in a non-interactive/agent context it prints setup instructions and exits non-zero. When you hit that, surface those instructions to the user (set `GEMINI_API_KEY`, or pass `--api-key`) — do **not** try to store the key from the skill.

## Environment Variables

These env vars override the corresponding CLI flags (useful for shells, CI, or a `.gemini/.env` file). **All satellites share the same key** because it is resolved by the CLI they all call — not stored per-skill.

| Env var | Equivalent flag | Purpose |
|---------|-----------------|---------|
| `TINY_GEMINI_API_KEY` | `--api-key` | API key (also accepts `GEMINI_API_KEY` and `GOOGLE_API_KEY`) |
| `TINY_GEMINI_API_BASE` | `--api-base` | Override the API base URL (e.g., for a proxy or custom endpoint). Default: `https://generativelanguage.googleapis.com/v1beta` |
| `TINY_GEMINI_MODEL` | `--model` | Default model for every command. Per-command defaults still apply if neither flag nor env var is set. |

## Commands Owned by This Skill

### prompt (default) — Text generation

Default model: `gemini-3-flash-preview`. Override with `--model` (run `npx tiny-gemini models list --type=text` for options — owned by `tiny-gemini-models`).

```bash
npx tiny-gemini "What is quantum computing?"
npx tiny-gemini "Describe this" --file photo.png
npx tiny-gemini "Summarize" --file doc.pdf
npx tiny-gemini "Tell me a joke" --stream
npx tiny-gemini "Extract data" --schema '{"type":"object","properties":{"name":{"type":"string"}}}'
npx tiny-gemini "Fix bugs" --prompt-file src/app.js --output-file result.json
npx tiny-gemini --prompt-file code.js --system "Explain this code"
```

Options: `--file`, `--prompt-file` (repeatable), `--output-file`, `--output-format`, `--system`, `--schema` (inline JSON or file path), `--stream`, `--model`.

The `--schema` flag wraps your JSON schema in the post-2026-05 `response_format: { type: "text", mime_type: "application/json", schema: {...} }` shape automatically.

### search — Google Search-grounded generation

Default model: `gemini-3-flash-preview`. Adds the `google_search` built-in tool.

```bash
npx tiny-gemini search "Who won the 2026 Super Bowl?"
npx tiny-gemini search "latest React release" --stream
npx tiny-gemini search "AI news" --output-file results.txt
```

Options: `--output-file`, `--output-format` (plain|manifest), `--stream`, `--model`.

### raw — JSON passthrough (100% API coverage)

Send any JSON body directly to `POST /v1beta/interactions`. Escape hatch for function calling, MCP, code execution, computer use, embeddings (use `--api-base` to redirect), etc.

```bash
npx tiny-gemini raw '{"model":"gemini-3-flash-preview","input":"hello"}'
echo '{"model":"...","input":"..."}' | npx tiny-gemini raw
npx tiny-gemini raw --file request.json
```

The CLI adds the `Api-Revision: 2026-05-20` header so responses use the post-2026-05 `steps` shape (not legacy `outputs`). For raw API body format, function calling, multi-turn conversations, embeddings access, and the full schema migration story, see [references/raw-api.md](references/raw-api.md).

## Global Options

`--api-key`, `--api-base`, `--model`, `--output-dir` (default: `./tiny-gemini-output`), `--prompt-file` (repeatable), `--output-file`, `--output-format` (plain/manifest), `--stream`, `--preview`, `--json-output`, `--help`, `--version`.

**Don't confuse `--json-output` with `--json`:**

| Flag | Where it works | What it does |
|------|----------------|--------------|
| `--json-output` | All API-bound commands (`prompt`, `image`, `tts`, `video`, `search`, `research`, `raw`) | Prints the **raw** API response JSON instead of human-formatted output |
| `--json` | `models` (registry JSON), `image` generation, and `video` generation (a **structured result envelope** — paths, sizes, cost; owned by `tiny-gemini-image` / `tiny-gemini-video`) | A curated, machine-readable result, not the raw API response |

The `models` command also accepts `--json-output` as an alias for convenience.

## Model Selection (Quick Reference)

The full registry, decision rules, and pricing live in `tiny-gemini-models`. Quick reference for the commands this skill owns:

| Command (this skill) | Default model |
|---------|---------------|
| `prompt`, `search` | `gemini-3-flash-preview` |
| `raw` | none — caller specifies `model` or `agent` in the body |

Passing `--model` resolving to `gemini-2.5-pro`, `gemini-2.5-flash`, or `gemini-2.5-flash-lite` triggers a stderr deprecation warning naming the replacement; after **2026-10-16** the call fails fast.

For "which model should I use for X", route to `tiny-gemini-models`. For full decision rules, see that skill's SKILL.md.

## Schema Migration (May–June 2026)

The CLI sends `Api-Revision: 2026-05-20` on every request, opting into Google's new Interactions API schema:

- **Response shape:** `steps` array (not legacy `outputs`). Affects raw command stdout — see [references/raw-api.md](references/raw-api.md) for jq extraction patterns.
- **Image config** in request bodies lives inside `response_format` with `"type": "image"`.
- **Structured output** wraps the JSON Schema in `response_format: { type: "text", mime_type: "application/json", schema: ... }`.
- **SSE events** use new names (`step.delta`, `interaction.created`, `interaction.completed`, `interaction.error`); legacy names (`content.delta`, etc.) are accepted defensively.
- Legacy schema is removed by Google on **2026-06-08**.

## Agentic Workflow (--prompt-file, --output-file)

Use these flags to keep file contents out of the agent context window. **Shared across all sibling skills** — defined here as the cross-cutting source of truth.

- `--prompt-file <path>` reads file as UTF-8, wraps with delimiters, appends to prompt. Repeatable.
- `--output-file <path>` writes response to disk, prints only a short summary to stdout.
- `--output-format=manifest` forces JSON manifest with file references for large outputs.
- `--output-format=plain` forces plain text output.
- Auto-detection: manifest when response has function calls or text blocks > 4000 chars.

```bash
# Code review with filesystem pipe
npx tiny-gemini "Fix bugs" --prompt-file src/app.js --prompt-file src/utils.js --output-file /tmp/result.json

# Combined with multimodal
npx tiny-gemini "Fix bugs in screenshot" --file screenshot.png --prompt-file src/app.js --output-file /tmp/manifest.json
```

## Constraints

- ALWAYS use `npx tiny-gemini` to invoke (not a global install)
- NEVER fabricate CLI flags not documented above or in [references/raw-api.md](references/raw-api.md)
- ALWAYS check that Node.js >= 18 is available before first use
- The `raw` command sends JSON directly to the API with no body modification (the CLI does add the `Api-Revision: 2026-05-20` header)
- Streaming (`--stream`) only captures text deltas, not images or audio
- For image / audio / video / research / model lookup, **route to the sibling skill** — don't try to handle them via `raw`
- Before recommending a specific model, route to `tiny-gemini-models` so the user gets the live registry, not a hardcoded answer
