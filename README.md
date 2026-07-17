# tiny-gemini

Zero-dependency CLI for the Google Gemini API. Text, images, TTS, video, search, deep research, and raw API passthrough — all through `npx`. Ships with a [Claude Code agent skill constellation](#claude-code-agent-skill) managed by [HappySkills](https://happyskills.ai).

```bash
# Ask a question
npx tiny-gemini "What is quantum computing?"

# Generate an image
npx tiny-gemini image "a dog chasing a cat through a field of sunflowers"
```

**Using Claude Code?** Install the agent skill and let Claude handle the CLI for you:

```bash
npx happyskills install nicolasdao/tiny-gemini
```

Then just ask naturally: *"Use Gemini to generate an image of a dog chasing a cat."*

## Table of Contents

<!-- BEGIN toc -->
- [Why This Exists](#why-this-exists)
- [Quick Start](#quick-start)
  - [Install](#install)
  - [API Key Setup](#api-key-setup)
- [Commands Overview](#commands-overview)
  - [prompt (default)](#prompt-default)
  - [image](#image)
  - [tts](#tts)
  - [video](#video)
  - [search](#search)
  - [research](#research)
  - [raw](#raw)
  - [models](#models)
- [Global Options](#global-options)
- [Agentic Workflow (--prompt-file, --output-file)](#agentic-workflow---prompt-file---output-file)
  - [How It Works](#how-it-works)
  - [Manifest Format](#manifest-format)
  - [Smart Detection Rules](#smart-detection-rules)
  - [Agentic Examples](#agentic-examples)
- [Claude Code Agent Skill](#claude-code-agent-skill)
  - [What It Does](#what-it-does)
  - [Install the Skill](#install-the-skill)
  - [How It Works](#how-it-works-1)
- [Stack and Dependencies](#stack-and-dependencies)
- [Project Structure](#project-structure)
- [Model Selection](#model-selection)
- [Documentation](#documentation)
- [Releasing](#releasing)
- [Keeping Current](#keeping-current)
- [Reference Material](#reference-material)
- [Changelog](#changelog)
- [License](#license)
<!-- END toc -->

## Why This Exists

As of March 2026, the official [Gemini CLI](https://github.com/google-gemini/gemini-cli) does not ship with built-in support for Nano Banana (Gemini's image generation models). To generate images, you need to install a separate extension — a process that is clunky and fragile. The Gemini CLI is also a heavy install with its own dependency tree, making it impractical for ephemeral or scripted use cases.

This pushed us to create something leaner. `tiny-gemini` doesn't need to be installed — it runs directly via `npx`. The primary motivation was to give other LLM agents (Claude Code, OpenAI Codex, and similar tools) a lightweight, zero-install way to call the Gemini API from bash. An agent can run `npx tiny-gemini "your prompt"` and get results without managing SDKs, dependencies, or extensions.

Google's Gemini API is a single unified endpoint (the [Interactions API](https://ai.google.dev/gemini-api/docs/interactions)) that handles text, images, audio, search, research, and more — all through the request body. But using it requires constructing JSON payloads, managing headers, parsing multimodal responses, and converting binary formats.

`tiny-gemini` wraps this API with dedicated subcommands for common use cases (`prompt`, `image`, `tts`, `video`, `search`, `research`) plus a `raw` JSON passthrough for full API coverage. It is:

- **Zero-dependency** — only Node.js built-ins (no `node_modules`)
- **Single file** — everything in `cli.js` (~1600 lines)
- **NPX-ready** — `npx tiny-gemini "your prompt"` works immediately, no install required
- **Complete** — the `raw` command covers 100% of the API surface
- **Agent-first** — built for LLM agents with `--prompt-file` and `--output-file` to keep context windows clean


## Quick Start

### Install

```bash
# Use directly via npx (no install needed)
npx tiny-gemini "What is quantum computing?"

# Or install globally
npm install -g tiny-gemini
```

Requires Node.js >= 18.0.0.

### API Key Setup

Get an API key from [Google AI Studio](https://aistudio.google.com/app/apikey).

**Interactive setup (first-time users):** If no API key is configured, the CLI detects whether you're in a terminal (TTY) and offers to save the key for you:

```
$ npx tiny-gemini "hello"

No API key found. You need a free Google Gemini API key.

  1. Go to https://aistudio.google.com/app/apikey
  2. Click "Create API key" and copy it.

  Paste it below to save it, or press Enter to skip: ************************************

  Saved to ~/.gemini/.env
```

The key is saved to `~/.gemini/.env` and the original command continues immediately. Input is masked with `*` characters. In non-TTY environments (pipes, scripts, LLM agents), a concise error with setup commands is shown instead.

**Option A: Environment variable** (recommended)
```bash
export GEMINI_API_KEY="your-key-here"
```
Add to `~/.zshrc` or `~/.bashrc` to persist.

**Option B: `.gemini/.env` file** (matches official Gemini CLI convention)
```bash
# User-wide (works from any directory)
mkdir -p ~/.gemini
echo 'GEMINI_API_KEY=your-key-here' > ~/.gemini/.env

# Or project-level (takes priority)
mkdir -p .gemini
echo 'GEMINI_API_KEY=your-key-here' > .gemini/.env
```

**Option C: CLI flag**
```bash
npx tiny-gemini --api-key=your-key-here "Hello"
```

Key resolution order: `--api-key` > `TINY_GEMINI_API_KEY` > `GEMINI_API_KEY` > `GOOGLE_API_KEY` > `.gemini/.env` (project, searching up) > `~/.gemini/.env`.

## Commands Overview

### prompt (default)

Text generation. The command name is optional — any unrecognized first argument is treated as a prompt.

```bash
tiny-gemini "What is quantum computing?"
tiny-gemini prompt "Describe this" --file photo.png
tiny-gemini "Summarize" --file doc.pdf
tiny-gemini "Tell me a joke" --stream
tiny-gemini "Extract name and age" --schema '{"type":"object","properties":{"name":{"type":"string"},"age":{"type":"integer"}}}'
tiny-gemini "Fix bugs" --prompt-file src/app.js --output-file result.json
```

Key options: `--file`, `--prompt-file`, `--output-file`, `--output-format`, `--system`, `--schema`, `--stream`, `--model`

### image

Image generation, editing, and understanding with 7 sub-commands.

```bash
tiny-gemini image "a cat on the moon"                          # generate (default)
tiny-gemini image generate "a cat" --count=3 --styles=watercolor,sketch
tiny-gemini image generate "Use Image A for the pose, Image B for the style" \
  --file pose.png --file style.png                             # reference images (compose/blend)
tiny-gemini image edit photo.png "add sunglasses"
tiny-gemini image describe photo.png
tiny-gemini image story "a seed growing" --steps=4
tiny-gemini image icon "coffee cup" --style=modern
tiny-gemini image pattern "geometric" --type=seamless
tiny-gemini image diagram "login flow" --type=flowchart
```

Key options: `--file` (reference images, repeatable), `--count`, `--styles`, `--variations`, `--concurrency`, `--out`, `--json`, `--dry-run`, `--steps`, `--style`, `--type`, `--aspect-ratio`, `--image-size`

**Batching:** the image API returns one image per call (no multi-image parameter), so `--count`/`--styles`/`--variations` issue one request each. The CLI runs them **concurrently** (bounded by `--concurrency`, default 4) instead of serially, and a single failed request doesn't abort the batch. Reference images compose with `--count` (N candidates sharing the same references). Pass `--json` for a structured result envelope (deterministic paths, dimensions, format, estimated cost) and `--dry-run` to preview cost before spending.

**Reference images:** pass up to 14 images with `--file` (repeatable) and refer to them in the prompt as **Image A, Image B, Image C…** (bound by `--file` order). Use `--file name=path` to label one — its name is added to the prompt so you can reference it directly. This follows [Google's published multi-image prompting guidance](https://blog.google/products-and-platforms/products/gemini/prompting-tips-nano-banana-pro/).

### tts

Text-to-speech. Outputs a `.wav` file.

```bash
tiny-gemini tts "Hello, how are you today?"
tiny-gemini tts "Bonjour" --voice=kore --language=fr-fr
```

Key options: `--voice` (default: Kore), `--language` (default: en-us)

### video

Text/image → video generation and editing via Gemini Omni Flash. Outputs an `.mp4` (720p, 24fps, 3–10s).

```bash
tiny-gemini video "a paper boat sailing down a rain gutter, slow motion, gentle rain sounds"  # text → video
tiny-gemini video "make this photo come alive" --first-frame scene.png                        # animate from an image
tiny-gemini video "in the style of <IMAGE_REF_0>, <IMAGE_REF_1> dances" --file style.png --file dancer.png  # reference images
tiny-gemini video "a neon skyline" --aspect-ratio=9:16                                         # portrait
tiny-gemini video edit clip.mp4 "make it night-time, keep everything else the same"           # edit an existing video
tiny-gemini video "add falling snow" --previous=v1_abc123                                      # refine a prior clip
```

Key options: `--first-frame` (start-frame image), `--file` (reference images → `<IMAGE_REF_0..N>`), `--aspect-ratio` (16:9 or 9:16), `--task`, `--count`, `--previous`, `--out`, `--json`, `--dry-run`, `--preview`

Reference images bind to `<FIRST_FRAME>` / `<IMAGE_REF_N>` tags you place in the prompt (the CLI prints the mapping). Omni also **generates audio** — describe it. Uses the same synchronous Interactions endpoint; output is billed per token (~$0.10/second of 720p, **no free tier**) and the CLI prints the **actual** cost. Clips carry a SynthID watermark. The `tiny-gemini-video` skill carries the full prompting playbook. For higher-fidelity/longer cinematic video, Veo is a separate API reachable via `raw`.

### search

Google Search-grounded generation.

```bash
tiny-gemini search "Who won the 2026 Super Bowl?"
tiny-gemini search "latest React release" --stream
tiny-gemini search "AI news" --output-file results.txt
```

### research

Deep Research agent. Runs in background, polls for completion.

```bash
tiny-gemini research "History of Google TPUs focusing on 2025-2026"
```

### raw

JSON passthrough — sends any JSON body directly to the Interactions API. Escape hatch for function calling, MCP, code execution, computer use, or anything else the API supports.

```bash
tiny-gemini raw '{"model":"gemini-3-flash-preview","input":"hello"}'
echo '{"model":"...","input":"..."}' | tiny-gemini raw
tiny-gemini raw --file request.json
```

### models

List the available Gemini models from an embedded snapshot. No API key required, no network call.

```bash
tiny-gemini models                       # human-readable table (alias for `models list`)
tiny-gemini models list --type=image     # filter by type: text, image, audio, video, embeddings, agent
tiny-gemini models list --status=ga      # filter by status: ga, preview, deprecated
tiny-gemini models pricing               # pricing-only table
tiny-gemini models list --json           # machine-readable
```

The data is a snapshot of [ai.google.dev/gemini-api/docs/models](https://ai.google.dev/gemini-api/docs/models) plus the pricing and deprecations pages — refreshed each release. Deprecated models surface their shutdown date and recommended replacement in the same row.

## Global Options

| Option | Env Var | Default | Description |
|--------|---------|---------|-------------|
| `--api-key` | `TINY_GEMINI_API_KEY` > `GEMINI_API_KEY` > `GOOGLE_API_KEY` | — | API key |
| `--api-base` | `TINY_GEMINI_API_BASE` | `https://generativelanguage.googleapis.com/v1beta` | API base URL |
| `--model` | `TINY_GEMINI_MODEL` | per-command default | Model override |
| `--output-dir` | — | `./tiny-gemini-output` | Output directory for generated files |
| `--prompt-file` | — | — | Read file contents into prompt (repeatable) |
| `--output-file` | — | — | Write response to file instead of stdout |
| `--output-format` | — | auto | `plain` or `manifest` (see [Agentic Workflow](#agentic-workflow---prompt-file---output-file)) |
| `--stream` | — | `false` | Enable streaming output |
| `--preview` | — | `false` | Open generated files after saving |
| `--json-output` | — | `false` | Print raw JSON response |
| `-h, --help` | — | — | Show help (supports per-command: `image --help`) |
| `-v, --version` | — | — | Show version |

## Agentic Workflow (--prompt-file, --output-file)

When an AI agent uses tiny-gemini via bash, large files can bloat the agent's context window in both directions. Two flags solve this by keeping the CLI as a filesystem-to-API pipe:

- **`--prompt-file <path>`**: The agent passes file paths, the CLI reads them and sends contents to Gemini. The agent never sees file contents in its context. Repeatable — use multiple times for multiple files.
- **`--output-file <path>`**: Gemini responds, the CLI writes to disk, and the agent sees only a short summary on stdout. The agent never sees response contents in its context.

### How It Works

**Input side:** `--prompt-file` reads each file as UTF-8 and wraps it with filename delimiters before appending to the prompt:

```
--- FILE: src/app.js ---
<file contents>
--- END FILE: src/app.js ---
```

`--prompt-file` and `--file` serve different purposes and work together: `--prompt-file` injects text file contents into the prompt, while `--file` sends binary files (images, audio, video, PDF) as base64 multimodal content.

**Output side:** When `--output-file` is set, the CLI uses smart detection (or `--output-format` override) to choose between two modes:

- **Plain text mode**: Writes the response text directly to the output file.
- **Manifest mode**: Writes a small JSON manifest to the output file, and writes large text blocks to separate files in `--output-dir`. This lets the agent read only the manifest to understand what Gemini produced.

### Manifest Format

```json
{
  "outputs": [
    {
      "type": "text",
      "preview": "Found 2 bugs: null ref on line 15, missing await...",
      "file": "./tiny-gemini-output/text_1.txt",
      "bytes": 245,
      "lines": 8
    }
  ],
  "function_calls": [
    {
      "name": "write_file",
      "id": "call_123",
      "arguments": { "path": "src/app.js" }
    }
  ],
  "images": [
    { "file": "./tiny-gemini-output/prompt_1.png" }
  ],
  "audio": []
}
```

### Smart Detection Rules

When `--output-format` is not specified, the CLI auto-detects the best format:

| Condition | Result |
|-----------|--------|
| `--output-format=manifest` | Always manifest |
| `--output-format=plain` | Always plain text |
| Response has function calls | Manifest |
| Any text block > 4000 chars | Manifest |
| Otherwise | Plain text |

### Agentic Examples

```bash
# Simple — short response goes to plain text file
tiny-gemini "What is 2+2?" --output-file answer.txt
# Stdout: "Response written to answer.txt"

# Code review — reads files, auto-detects manifest for large output
tiny-gemini "Fix bugs in these files" \
  --prompt-file src/app.js \
  --prompt-file src/utils.js \
  --output-file /tmp/manifest.json
# Stdout: "Manifest written to /tmp/manifest.json (3 text blocks, 847 lines)"

# Force manifest even for short responses
tiny-gemini "What is 2+2?" --output-file answer.json --output-format=manifest

# Force plain text even for long responses
tiny-gemini "Rewrite this" --prompt-file app.js --output-file rewritten.txt --output-format=plain

# Prompt-file only (no text prompt), with system instruction
tiny-gemini --prompt-file src/app.js --system "Explain this code"

# Combined with multimodal + schema
tiny-gemini "Fix bugs shown in this screenshot" \
  --file screenshot.png \
  --prompt-file src/app.js \
  --output-file /tmp/manifest.json
```

## Claude Code Agent Skill

This project ships with a **constellation of [Claude Code](https://claude.ai/claude-code) agent skills** that teach AI agents how to use `tiny-gemini` automatically. They are managed by [HappySkills](https://happyskills.ai) — a package manager for AI agent skills.

### What It Does

When the skills are installed in a project, Claude Code automatically knows how to use `npx tiny-gemini` whenever you ask it to work with the Gemini API. No manual instructions needed — just ask naturally:

- "Generate an image of a sunset over the ocean"
- "Convert this text to speech"
- "Search for the latest AI news"
- "Run deep research on quantum computing"
- "Send this JSON to the Gemini API"

Together the skills cover 100% of the CLI surface: all 8 commands, all 7 image sub-commands, the 2 video sub-commands, all options, model-selection rules, and agentic workflow patterns.

### Install the Skill

```bash
npx happyskills install nicolasdao/tiny-gemini
```

Installing the core pulls in its satellites (declared as dependencies) into your project's `.claude/skills/` directory. Claude Code auto-detects them on the next session.

### How It Works

The suite is a **core skill plus focused satellites**, each auto-invocable for its own intent (you never invoke them by hand — Claude loads the right one when it detects the matching intent). The core declares the capability satellites as dependencies, so installing it installs the whole set:

| Skill | Owns |
|-------|------|
| `tiny-gemini` (core) | Text Q&A, search-grounded answers, and the `raw` JSON passthrough (100% API coverage); ships `references/raw-api.md` |
| `tiny-gemini-image` | Image generation, editing, and understanding (all 7 image sub-commands) |
| `tiny-gemini-tts` | Text-to-speech (WAV) |
| `tiny-gemini-video` | Text/image → video generation and editing (MP4, Gemini Omni Flash) |
| `tiny-gemini-research` | Multi-minute Deep Research agents |
| `tiny-gemini-models` | Offline model registry, pricing, and deprecation lookup |
| `tiny-gemini-upkeep` | Auditing the CLI + skills against the live Gemini docs (see [Keeping Current](#keeping-current)) |
| `release-tiny-gemini` | The local release workflow (see [Releasing](#releasing)) |

The skill sources live in `.agents/skills/` and are surfaced under `.claude/skills/` via symlinks.

## Stack and Dependencies

| Component | Details |
|-----------|---------|
| Runtime | Node.js >= 18.0.0 |
| Dependencies | **None** — zero `node_modules` |
| API | [Gemini Interactions API](https://ai.google.dev/gemini-api/docs/interactions) (v1beta) |
| HTTP | Built-in `fetch` (Node 18+) |
| Arg parsing | `node:util` `parseArgs` |
| File I/O | `node:fs/promises` |
| Audio encoding | Inline WAV header construction (no ffmpeg) |
| Config | `.gemini/.env` file loader (built-in, no dotenv package) |
| Module format | ESM (`"type": "module"`) |

## Project Structure

```
tiny-gemini/
├── cli.js          # Single executable (~1600 lines, all logic)
├── models.json     # Embedded snapshot of Gemini model registry + pricing
├── package.json    # NPX-ready with bin entry
├── CHANGELOG.md    # Release history (Keep a Changelog format)
├── LICENSE         # BSD-3-Clause
├── .gitignore
├── README.md
├── .agents/skills/                     # Claude Code agent skill constellation (surfaced under .claude/skills/ via symlinks, managed by HappySkills)
│   ├── tiny-gemini/                    # Core — text, search, raw API (references/raw-api.md)
│   ├── tiny-gemini-image/              # Image generation, editing, understanding
│   ├── tiny-gemini-tts/                # Text-to-speech
│   ├── tiny-gemini-video/              # Text/image → video generation and editing
│   ├── tiny-gemini-research/           # Deep Research agents
│   ├── tiny-gemini-models/             # Offline model registry lookup
│   ├── tiny-gemini-upkeep/             # Currency check vs live Gemini docs
│   └── release-tiny-gemini/            # Local release workflow
└── docs/
    ├── api-reference.md       # Gemini Interactions API details
    ├── architecture.md        # Code structure and how to add features
    ├── commands.md            # Full command reference with request bodies
    ├── model-selection.md     # Model comparison, pricing, and decision rules
    ├── prompt-engineering.md  # Image presets, batch generation, variations
    ├── sources.md             # Canonical registry of official sources + currency-check procedure
    ├── gotchas.md             # Project-specific pitfalls and how to avoid them
    └── manual/
        └── 20260307-gemini/   # Local snapshots of official Google docs
            ├── interactions.md
            └── image-generation.md
```

## Model Selection

See [Model Selection Guide](docs/model-selection.md) for a complete comparison of all Gemini models — capabilities, pricing, and decision rules for choosing the right model for each task.

## Documentation

The following docs provide the technical depth needed to understand, extend, or debug the CLI. Start with the one that matches your task:

<!-- BEGIN doc-index -->
- [Gemini Interactions API Reference](docs/api-reference.md) — The Gemini Interactions API tiny-gemini wraps — endpoint, headers, request/response format, streaming SSE protocol, output types, models, and known limitations.
- [Architecture](docs/architecture.md) — Internal structure of cli.js — file layout, code sections, config resolution, the .env loader, the API client, data flow, and how to add new commands.
- [Command Reference](docs/commands.md) — Full reference for every command and option (prompt, image, tts, search, research, raw, models), the exact request bodies sent to the API, and how responses are processed.
- [Gotchas](docs/gotchas.md) — Project-specific pitfalls in how the CLI builds requests, picks default models, and handles responses — Interactions-vs-generateContent schema, lowercase modality enums, array speech_config, fast preview-model deprecation, and JPEG image output.
- [Model Selection Guide](docs/model-selection.md) — Choosing which Gemini model to use — decision rules, capabilities, pricing, and comparison tables for text, image, and specialized models.
- [Prompt Engineering](docs/prompt-engineering.md) — Image generation presets (icon, pattern, diagram, story), batch generation with styles and variations, and how the prompt builder functions work.
- [Sources](docs/sources.md) — The single canonical registry of every external source this project is built on — official Gemini API docs, model/pricing/deprecation pages, prompting guides, auth conventions, and local snapshots — plus the step-by-step procedure for checking that the CLI and skills are still up to date. Designed to be consumed by a future "check-currency" skill.
<!-- END doc-index -->

## Releasing

New versions are released using the `/release-tiny-gemini` Claude Code skill. It automates the local release workflow:

1. **Reasons about session changes** to determine the semver bump type (or accepts `patch`, `minor`, `major` as an argument, plus an optional quoted description)
2. **Runs preflight checks** — clean working tree, on `master` branch, `CHANGELOG.md` exists
3. **Bumps the version** in `package.json` and syncs the `const VERSION` constant in `cli.js`
4. **Updates `CHANGELOG.md`** with categorized changes in Keep a Changelog format (stamps the `[Unreleased]` section into a versioned release)
5. **Verifies** the CLI loads via `node cli.js --version` and confirms the output matches
6. **Commits and tags** locally — `chore(release): tiny-gemini v<version>` plus an annotated `v<version>` tag

The skill stops there. Pushing and publishing are intentionally manual — when you're ready, run:

```bash
git push origin master
git push origin v<version>
npm publish
```

```bash
/release-tiny-gemini patch                              # bug fixes
/release-tiny-gemini minor                              # new features
/release-tiny-gemini major                              # breaking changes
/release-tiny-gemini                                    # agent decides and asks you to confirm
/release-tiny-gemini draft                              # capture unreleased notes mid-session, no version bump
/release-tiny-gemini minor "Added streaming SSE"        # explicit bump with a description
```

The skill is at [`.claude/skills/release-tiny-gemini/`](.claude/skills/release-tiny-gemini/SKILL.md). It is auto-invocable (Claude may trigger it on phrases like "release tiny-gemini" or "ship a new version"), and always confirms via prompt before any commit or tag.

## Keeping Current

The Gemini API and model lineup move fast — new models reach GA, previews shut down, and the request schema changes. The `/tiny-gemini-upkeep` Claude Code skill keeps this project in sync with Google's official docs so you don't have to audit them by hand.

Invoke it by asking naturally (*"is tiny-gemini up to date?"*, *"did Gemini ship new models?"*, *"check for Gemini breaking changes"*) or explicitly:

```bash
/tiny-gemini-upkeep                 # full sweep
/tiny-gemini-upkeep models          # focus on the model registry
/tiny-gemini-upkeep schema          # focus on the request/response schema
```

What it does:

1. Reads the source registry in [docs/sources.md](docs/sources.md) plus the current baseline (`models.json`, `cli.js`).
2. Fans out research sub-agents to **verify** every known official source for new models, deprecations, pricing changes, and breaking API changes.
3. **Discovers** what the registry doesn't track yet — new model families, new capabilities, and brand-new official sources — and folds any new sources back into `docs/sources.md`.
4. Presents a reconciled findings report and **waits for your approval before editing anything**.
5. On approval, updates `cli.js` / `models.json` / docs / skills, smoke-tests any schema change against the live API, records the run in the `docs/sources.md` verification log, and hands release/publish back to `/release-tiny-gemini` and the HappySkills flow.

It is auto-invocable (Claude may trigger it when you ask about Gemini currency) and never publishes or releases on its own. The skill is at [`.claude/skills/tiny-gemini-upkeep/`](.claude/skills/tiny-gemini-upkeep/SKILL.md); the procedure it automates is documented in [docs/sources.md § Currency-check procedure](docs/sources.md#5-currency-check-procedure).

## Reference Material

Every official source this project is built on — the Gemini API docs, the model / pricing / deprecation pages, the prompting guides, the auth conventions, and the frozen local snapshots — is catalogued in **one canonical registry: [docs/sources.md](docs/sources.md)**. That document also carries the step-by-step **currency-check procedure** (what to re-verify and which files it drives) and a **verification log**. Last verified against live docs: **2026-07-16**.

Start any "are we still up to date?" check from the [Gemini API changelog](https://ai.google.dev/gemini-api/docs/changelog) (the primary feed), then follow the procedure in `docs/sources.md` — or let the `/tiny-gemini-upkeep` skill run it for you (see [Keeping Current](#keeping-current)). Local snapshots of the two primary sources are frozen under `docs/manual/20260307-gemini/` (2026-03-07, **pre-migration** — deliberately out of date; see [Gotchas](docs/gotchas.md)).

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for release history. Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## License

BSD-3-Clause
