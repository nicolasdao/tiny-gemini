---
description: Use the Google Gemini API via npx tiny-gemini CLI. Text generation, image generation and editing, text-to-speech, Google Search grounding, deep research, and raw API passthrough. Use when working with Gemini, Google AI, generating images, TTS audio, search-grounded answers, or deep research reports.
user-invocable: false
allowed-tools: Bash, Read
---

# tiny-gemini — Gemini API via NPX

Zero-dependency CLI for the Google Gemini API. Requires Node.js >= 18 and npx.

## API Key Setup

The CLI needs a `GEMINI_API_KEY`. Resolution order: `--api-key` flag > `TINY_GEMINI_API_KEY` env > `GEMINI_API_KEY` env > `GOOGLE_API_KEY` env > `.gemini/.env` (project, searching up) > `~/.gemini/.env`.

If no key is found in a TTY terminal, the CLI prompts interactively. In non-TTY (agent/pipe), it shows setup instructions.

## Commands Quick Reference

### prompt (default) — Text generation

```bash
npx tiny-gemini "What is quantum computing?"
npx tiny-gemini "Describe this" --file photo.png
npx tiny-gemini "Summarize" --file doc.pdf
npx tiny-gemini "Tell me a joke" --stream
npx tiny-gemini "Extract data" --schema '{"type":"object","properties":{"name":{"type":"string"}}}'
npx tiny-gemini "Fix bugs" --prompt-file src/app.js --output-file result.json
npx tiny-gemini --prompt-file code.js --system "Explain this code"
```

Options: `--file`, `--prompt-file` (repeatable), `--output-file`, `--output-format`, `--system`, `--schema` (inline JSON or file path), `--stream`, `--model`

### image — Image generation, editing, understanding

7 sub-commands. Default model: `gemini-3.1-flash-image-preview`.

```bash
npx tiny-gemini image "a cat on the moon"                          # generate (default)
npx tiny-gemini image generate "a cat" --count=3 --styles=watercolor,sketch
npx tiny-gemini image edit photo.png "add sunglasses"
npx tiny-gemini image describe photo.png
npx tiny-gemini image describe photo.png "What breed is this dog?"
npx tiny-gemini image story "a seed growing" --steps=4
npx tiny-gemini image icon "coffee cup" --style=modern --type=app-icon
npx tiny-gemini image pattern "geometric" --type=seamless --colors=mono
npx tiny-gemini image diagram "login flow" --type=flowchart --layout=horizontal
```

For all image sub-command options, see [references/image-commands.md](references/image-commands.md).

### tts — Text-to-speech (WAV output)

```bash
npx tiny-gemini tts "Hello, how are you today?"
npx tiny-gemini tts "Bonjour" --voice=kore --language=fr-fr
```

Options: `--voice` (default: kore), `--language` (default: en-us)

### search — Google Search-grounded generation

```bash
npx tiny-gemini search "Who won the 2026 Super Bowl?"
npx tiny-gemini search "latest React release" --stream
```

### research — Deep Research agent (multi-minute)

```bash
npx tiny-gemini research "History of Google TPUs focusing on 2025-2026"
```

Runs in background, polls every 5s, prints status to stderr.

### raw — JSON passthrough (100% API coverage)

```bash
npx tiny-gemini raw '{"model":"gemini-3-flash-preview","input":"hello"}'
echo '{"model":"...","input":"..."}' | npx tiny-gemini raw
npx tiny-gemini raw --file request.json
```

For raw API body format and advanced features (function calling, tools, conversation), see [references/raw-api.md](references/raw-api.md).

## Global Options

`--api-key`, `--api-base`, `--model`, `--output-dir` (default: ./tiny-gemini-output), `--prompt-file` (repeatable), `--output-file`, `--output-format` (plain/manifest), `--stream`, `--preview`, `--json-output`, `--help`, `--version`

## Model Selection

For the full model comparison and decision rules, see [references/models.md](references/models.md).

| Command | Default Model |
|---------|---------------|
| prompt, search | `gemini-3-flash-preview` |
| image (generate, edit, story, icon, pattern, diagram) | `gemini-3.1-flash-image-preview` |
| image describe | `gemini-3-flash-preview` |
| tts | `gemini-2.5-flash-preview-tts` |
| research | `deep-research-pro-preview-12-2025` (agent) |

Override any default with `--model=<model-id>`.

## Agentic Workflow (--prompt-file, --output-file)

Use these flags to keep file contents out of the agent context window.

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
- NEVER fabricate CLI flags not documented above or in the reference files
- ALWAYS check that Node.js >= 18 is available before first use
- When generating images, files are saved to `--output-dir` (default: ./tiny-gemini-output)
- The `raw` command sends JSON directly to the API with no modification
- Research tasks can take several minutes, plan accordingly
- Streaming (`--stream`) only captures text, not images or audio
