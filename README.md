# tiny-gemini

Zero-dependency CLI for the Google Gemini API. Text, images, TTS, search, deep research, and raw API passthrough — all through `npx`. Ships with a [Claude Code agent skill](#claude-code-agent-skill) managed by [HappySkills](https://happyskills.ai).

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

- [Why This Exists](#why-this-exists)
- [Quick Start](#quick-start)
  - [Install](#install)
  - [API Key Setup](#api-key-setup)
- [Commands Overview](#commands-overview)
  - [prompt (default)](#prompt-default)
  - [image](#image)
  - [tts](#tts)
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
- [Detailed Documentation](#detailed-documentation)
- [Releasing](#releasing)
- [Reference Material](#reference-material)
- [Changelog](#changelog)
- [License](#license)

## Why This Exists

As of March 2026, the official [Gemini CLI](https://github.com/google-gemini/gemini-cli) does not ship with built-in support for Nano Banana (Gemini's image generation models). To generate images, you need to install a separate extension — a process that is clunky and fragile. The Gemini CLI is also a heavy install with its own dependency tree, making it impractical for ephemeral or scripted use cases.

This pushed us to create something leaner. `tiny-gemini` doesn't need to be installed — it runs directly via `npx`. The primary motivation was to give other LLM agents (Claude Code, OpenAI Codex, and similar tools) a lightweight, zero-install way to call the Gemini API from bash. An agent can run `npx tiny-gemini "your prompt"` and get results without managing SDKs, dependencies, or extensions.

Google's Gemini API is a single unified endpoint (the [Interactions API](https://ai.google.dev/gemini-api/docs/interactions)) that handles text, images, audio, search, research, and more — all through the request body. But using it requires constructing JSON payloads, managing headers, parsing multimodal responses, and converting binary formats.

`tiny-gemini` wraps this API with dedicated subcommands for common use cases (`prompt`, `image`, `tts`, `search`, `research`) plus a `raw` JSON passthrough for full API coverage. It is:

- **Zero-dependency** — only Node.js built-ins (no `node_modules`)
- **Single file** — everything in `cli.js` (~1070 lines)
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
tiny-gemini image edit photo.png "add sunglasses"
tiny-gemini image describe photo.png
tiny-gemini image story "a seed growing" --steps=4
tiny-gemini image icon "coffee cup" --style=modern
tiny-gemini image pattern "geometric" --type=seamless
tiny-gemini image diagram "login flow" --type=flowchart
```

Key options: `--count`, `--styles`, `--variations`, `--steps`, `--style`, `--type`, `--aspect-ratio`, `--image-size`

### tts

Text-to-speech. Outputs a `.wav` file.

```bash
tiny-gemini tts "Hello, how are you today?"
tiny-gemini tts "Bonjour" --voice=kore --language=fr-fr
```

Key options: `--voice` (default: Kore), `--language` (default: en-us)

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
tiny-gemini models list --type=image     # filter by type: text, image, audio, embeddings, agent
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

This project ships with a [Claude Code](https://claude.ai/claude-code) agent skill that teaches AI agents how to use `tiny-gemini` automatically. The skill is managed by [HappySkills](https://happyskills.ai) — a package manager for AI agent skills.

### What It Does

When the skill is installed in a project, Claude Code automatically knows how to use `npx tiny-gemini` whenever you ask it to work with the Gemini API. No manual instructions needed — just ask naturally:

- "Generate an image of a sunset over the ocean"
- "Convert this text to speech"
- "Search for the latest AI news"
- "Run deep research on quantum computing"
- "Send this JSON to the Gemini API"

The skill covers 100% of the CLI surface: all 6 commands, all 7 image sub-commands, all options, model selection rules, and agentic workflow patterns.

### Install the Skill

```bash
npx happyskills install nicolasdao/tiny-gemini
```

This installs the skill into your project's `.claude/skills/` directory. Claude Code will auto-detect it on the next session.

### How It Works

The skill is a set of reference files that Claude Code loads on demand:

| File | Purpose |
|------|---------|
| `SKILL.md` | Core reference — commands, options, examples, constraints |
| `references/image-commands.md` | All 7 image sub-commands with every option and value |
| `references/models.md` | Model selection decision rules and comparison tables |
| `references/raw-api.md` | Raw API passthrough, function calling, tools, multi-turn conversations |

The skill is set to `user-invocable: false` — Claude loads it automatically when it detects Gemini-related intent. You never need to invoke it manually.

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
├── cli.js          # Single executable (~1300 lines, all logic)
├── models.json     # Embedded snapshot of Gemini model registry + pricing
├── package.json    # NPX-ready with bin entry
├── CHANGELOG.md    # Release history (Keep a Changelog format)
├── LICENSE         # BSD-3-Clause
├── .gitignore
├── README.md
├── .claude/skills/tiny-gemini/         # Claude Code agent skill (managed by HappySkills)
│   ├── SKILL.md                        # Core skill — commands, options, constraints
│   ├── skill.json                      # HappySkills manifest (name, version, keywords)
│   └── references/
│       ├── image-commands.md           # All 7 image sub-commands
│       ├── models.md                   # Model selection rules
│       └── raw-api.md                  # Raw API, function calling, tools
└── docs/
    ├── api-reference.md       # Gemini Interactions API details
    ├── architecture.md        # Code structure and how to add features
    ├── commands.md            # Full command reference with request bodies
    ├── model-selection.md     # Model comparison, pricing, and decision rules
    ├── prompt-engineering.md  # Image presets, batch generation, variations
    ├── gotchas.md             # Project-specific pitfalls and how to avoid them
    └── 20260307-gemini/       # Local snapshots of official Google docs
        ├── interactions.md
        └── image-generation.md
```

## Model Selection

See [Model Selection Guide](docs/model-selection.md) for a complete comparison of all Gemini models — capabilities, pricing, and decision rules for choosing the right model for each task.

## Detailed Documentation

The following docs provide the technical depth needed to understand, extend, or debug the CLI. Start with the one that matches your task:

| Document | When to Read |
|----------|--------------|
| [API Reference](docs/api-reference.md) | Understanding the Gemini Interactions API: endpoint, headers, request/response format, streaming SSE protocol, output types, models, and known limitations |
| [Architecture](docs/architecture.md) | Understanding the code structure, adding new commands or sub-commands, modifying config resolution, the `.env` loader, or the API client |
| [Model Selection](docs/model-selection.md) | Choosing which Gemini model to use: decision rules, capabilities, pricing, and comparison tables for text, image, and specialized models |
| [Commands](docs/commands.md) | Full reference for every command and option, including the exact request bodies sent to the API and how responses are processed |
| [Prompt Engineering](docs/prompt-engineering.md) | Image generation presets (icon, pattern, diagram, story), batch generation with styles/variations, and how prompt builders work |
| [Gotchas](docs/gotchas.md) | Project-specific pitfalls: Interactions-vs-`generateContent` schema differences, lowercase modality enums, array `speech_config`, fast preview-model deprecations, JPEG image output |

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

## Reference Material

This project was built using the following official Google documentation. **Local snapshots** of the two primary sources are saved in `docs/20260307-gemini/` for offline reference and to preserve the exact API state this project was built against.

| Source | Local Snapshot | Description |
|--------|----------------|-------------|
| [Gemini Interactions API](https://ai.google.dev/gemini-api/docs/interactions) | [docs/20260307-gemini/interactions.md](docs/20260307-gemini/interactions.md) | The unified API endpoint this CLI wraps |
| [Gemini Image Generation](https://ai.google.dev/gemini-api/docs/image-generation) | [docs/20260307-gemini/image-generation.md](docs/20260307-gemini/image-generation.md) | Image generation models, capabilities, and configuration |
| [Gemini API Models](https://ai.google.dev/gemini-api/docs/models) | — | Available models and their capabilities |
| [Gemini API Keys](https://ai.google.dev/gemini-api/docs/api-key) | — | API key setup and environment variable conventions |
| [Gemini CLI Authentication](https://github.com/google-gemini/gemini-cli/blob/main/docs/get-started/authentication.md) | — | `.gemini/.env` file convention |

When the API changes or models are deprecated, compare the local snapshots against the live docs to understand what shifted.

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for release history. Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## License

BSD-3-Clause
