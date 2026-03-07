# tiny-gemini

Zero-dependency CLI for the Google Gemini API. Text, images, TTS, search, deep research, and raw API passthrough — all through `npx`.

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
- [Global Options](#global-options)
- [Stack and Dependencies](#stack-and-dependencies)
- [Project Structure](#project-structure)
- [Detailed Documentation](#detailed-documentation)
- [Reference Material](#reference-material)
- [Changelog](#changelog)
- [License](#license)

## Why This Exists

Google's Gemini API is a single unified endpoint (the [Interactions API](https://ai.google.dev/gemini-api/docs/interactions)) that handles text, images, audio, search, research, and more — all through the request body. But using it requires constructing JSON payloads, managing headers, parsing multimodal responses, and converting binary formats.

`tiny-gemini` wraps this API with dedicated subcommands for common use cases (`prompt`, `image`, `tts`, `search`, `research`) plus a `raw` JSON passthrough for full API coverage. It is:

- **Zero-dependency** — only Node.js built-ins (no `node_modules`)
- **Single file** — everything in `cli.js` (~970 lines)
- **NPX-ready** — `npx tiny-gemini "your prompt"` works immediately
- **Complete** — the `raw` command covers 100% of the API surface

The image presets (story, icon, pattern, diagram) are inherited from the [Nano Banana](https://github.com/nicoholas-dao/nanobanana) project.

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
```

Key options: `--file`, `--system`, `--schema`, `--stream`, `--model`

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

Key options: `--voice` (default: kore), `--language` (default: en-us)

### search

Google Search-grounded generation.

```bash
tiny-gemini search "Who won the 2026 Super Bowl?"
tiny-gemini search "latest React release" --stream
```

### research

Deep Research agent. Runs in background, polls for completion.

```bash
tiny-gemini research "History of Google TPUs focusing on 2025-2026"
```

### raw

JSON passthrough — sends any JSON body directly to the Interactions API. Escape hatch for function calling, MCP, code execution, computer use, or anything else the API supports.

```bash
tiny-gemini raw '{"model":"gemini-2.5-flash","input":"hello"}'
echo '{"model":"...","input":"..."}' | tiny-gemini raw
tiny-gemini raw --file request.json
```

## Global Options

| Option | Env Var | Default | Description |
|--------|---------|---------|-------------|
| `--api-key` | `TINY_GEMINI_API_KEY` > `GEMINI_API_KEY` > `GOOGLE_API_KEY` | — | API key |
| `--api-base` | `TINY_GEMINI_API_BASE` | `https://generativelanguage.googleapis.com/v1beta` | API base URL |
| `--model` | `TINY_GEMINI_MODEL` | per-command default | Model override |
| `--output-dir` | — | `./tiny-gemini-output` | Output directory for generated files |
| `--stream` | — | `false` | Enable streaming output |
| `--preview` | — | `false` | Open generated files after saving |
| `--json-output` | — | `false` | Print raw JSON response |
| `-h, --help` | — | — | Show help (supports per-command: `image --help`) |
| `-v, --version` | — | — | Show version |

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
├── cli.js          # Single executable (~970 lines, all logic)
├── package.json    # NPX-ready with bin entry
├── CHANGELOG.md    # Release history (Keep a Changelog format)
├── LICENSE         # BSD-3-Clause
├── .gitignore
├── README.md
└── docs/
    ├── api-reference.md       # Gemini Interactions API details
    ├── architecture.md        # Code structure and how to add features
    ├── commands.md            # Full command reference with request bodies
    ├── prompt-engineering.md  # Image presets, batch generation, variations
    └── 20260307-gemini/       # Local snapshots of official Google docs
        ├── interactions.md
        └── image-generation.md
```

## Detailed Documentation

The following docs provide the technical depth needed to understand, extend, or debug the CLI. Start with the one that matches your task:

| Document | When to Read |
|----------|--------------|
| [API Reference](docs/api-reference.md) | Understanding the Gemini Interactions API: endpoint, headers, request/response format, streaming SSE protocol, output types, models, and known limitations |
| [Architecture](docs/architecture.md) | Understanding the code structure, adding new commands or sub-commands, modifying config resolution, the `.env` loader, or the API client |
| [Commands](docs/commands.md) | Full reference for every command and option, including the exact request bodies sent to the API and how responses are processed |
| [Prompt Engineering](docs/prompt-engineering.md) | Image generation presets (icon, pattern, diagram, story), batch generation with styles/variations, and how prompt builders work |

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
