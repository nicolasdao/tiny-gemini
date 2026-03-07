# Architecture

This document explains the internal structure of `cli.js`, how the pieces fit together, and how to add new features.

## Table of Contents

- [File Layout](#file-layout)
- [Code Sections](#code-sections)
  - [Section 1: Constants (lines 1-34)](#section-1-constants-lines-1-34)
  - [Section 2: Utilities (lines 36-58)](#section-2-utilities-lines-36-58)
  - [Section 3: .env Loader (lines 60-113)](#section-3-env-loader-lines-60-113)
    - [Search Order](#search-order)
    - [File Format](#file-format)
  - [Section 4: Config Resolution (lines 115-135)](#section-4-config-resolution-lines-115-135)
    - [Priority Chain](#priority-chain)
  - [Section 5: Help Text (lines 137-310)](#section-5-help-text-lines-137-310)
  - [Section 6: API Client (lines 312-400)](#section-6-api-client-lines-312-400)
    - [callAPI](#callapi)
    - [callAPIStream](#callapistream)
    - [extractOutputs](#extractoutputs)
    - [pollCompletion](#pollcompletion)
  - [Section 7: File Handling (lines 402-481)](#section-7-file-handling-lines-402-481)
    - [Output Pipeline](#output-pipeline)
    - [MIME Type Mapping](#mime-type-mapping)
    - [WAV Header Construction](#wav-header-construction)
  - [Section 8: Prompt Builders (lines 483-556)](#section-8-prompt-builders-lines-483-556)
  - [Section 9: Command Handlers (lines 569-890)](#section-9-command-handlers-lines-569-890)
  - [Section 10: Main Dispatch (lines 892-979)](#section-10-main-dispatch-lines-892-979)
    - [Argument Parsing](#argument-parsing)
    - [Command Detection](#command-detection)
- [Data Flow](#data-flow)
  - [Non-Streaming Request](#non-streaming-request)
  - [Streaming Request](#streaming-request)
  - [Background Task (Research)](#background-task-research)
- [How to Add a New Command](#how-to-add-a-new-command)
  - [Step 1: Register the Command](#step-1-register-the-command)
  - [Step 2: Add Help Text](#step-2-add-help-text)
  - [Step 3: Create the Handler](#step-3-create-the-handler)
  - [Step 4: Add to Dispatch](#step-4-add-to-dispatch)
  - [Step 5: Add Options (if needed)](#step-5-add-options-if-needed)
- [How to Add an Image Sub-Command](#how-to-add-an-image-sub-command)
- [Key Design Decisions](#key-design-decisions)
  - [Why Interactions API (not generateContent)](#why-interactions-api-not-generatecontent)
  - [Why x-goog-api-key Header (not URL param)](#why-x-goog-api-key-header-not-url-param)
  - [Why Inline WAV Construction](#why-inline-wav-construction)
  - [Why Per-Command Model Defaults](#why-per-command-model-defaults)
  - [Why strict: false in parseArgs](#why-strict-false-in-parseargs)
- [Error Handling](#error-handling)
  - [APIError Class](#apierror-class)
  - [stderr vs stdout Convention](#stderr-vs-stdout-convention)

## File Layout

The entire CLI is a single file: `cli.js`. This is intentional — it keeps the project NPX-friendly (no `node_modules`, no build step) and makes it easy to audit or fork.

```
cli.js (~970 lines)
├── Shebang + Imports          (lines 1-7)
├── Constants                  (lines 9-34)
├── Utilities                  (lines 36-58)
├── .env Loader                (lines 60-113)
├── Config Resolution          (lines 115-135)
├── Help Text                  (lines 137-310)
├── API Client                 (lines 312-400)
├── File Handling              (lines 402-481)
├── Prompt Builders            (lines 483-556)
├── Stdin Reader               (lines 558-567)
├── Command Handlers           (lines 569-890)
└── Main Dispatch              (lines 892-979)
```

## Code Sections

### Section 1: Constants (lines 1-34)

```javascript
const MODELS = {
    text: 'gemini-2.5-flash',
    image: 'gemini-2.5-flash-image',
    tts: 'gemini-2.5-flash-preview-tts',
    research: 'deep-research-pro-preview-12-2025',
};
```

- `COMMANDS` — recognized top-level commands: `prompt`, `image`, `tts`, `search`, `research`, `raw`
- `IMAGE_SUBS` — image sub-commands: `generate`, `edit`, `describe`, `story`, `icon`, `pattern`, `diagram`
- `VARIATIONS` — variation map for batch image generation (7 categories, 2 alternatives each)

### Section 2: Utilities (lines 36-58)

- `log()` — writes to **stderr** (status messages, progress)
- `die()` — writes error to stderr and exits with code 1
- `exists()` — async file existence check via `access()`
- `tryJSON()` — safe JSON parse returning null on failure
- `APIError` — error class that extracts the API error message from response body

### Section 3: .env Loader (lines 60-113)

Implements the same `.gemini/.env` convention as the official [Gemini CLI](https://github.com/google-gemini/gemini-cli/blob/main/docs/get-started/authentication.md).

#### Search Order

1. Walk up from `process.cwd()` looking for `.gemini/.env` at each directory level
2. Fall back to `~/.gemini/.env`
3. First file found wins (files are not merged)

#### File Format

Standard `.env` format:
```
# Comments are ignored
KEY=value
KEY="quoted value"
KEY='single quoted value'
```

The loader is cached (`_dotenvCache`) — it only reads the file once per process.

### Section 4: Config Resolution (lines 115-135)

The `resolveConfig(values)` function merges CLI flags, environment variables, and `.env` values into a single config object.

#### Priority Chain

For each config value, highest priority first:

1. CLI flag (e.g., `--api-key`)
2. `TINY_GEMINI_*` env var (tool-specific override)
3. `GEMINI_API_KEY` env var (standard Gemini convention)
4. `GOOGLE_API_KEY` env var (Google Cloud convention)
5. `.gemini/.env` file values (same precedence order for keys within the file)
6. Hardcoded defaults

The `env()` helper checks `process.env` first, then falls back to `_dotenvCache`.

### Section 5: Help Text (lines 137-310)

Each command has its own help string constant (`HELP_PROMPT`, `HELP_IMAGE`, etc.) mapped in `HELP_MAP`. The `showHelp(command)` function prints command-specific help if a command is given, otherwise shows the main help.

Help is triggered by `--help` or `-h`. The `--help` flag is checked **after** command detection, so `tiny-gemini image --help` shows image-specific help.

### Section 6: API Client (lines 312-400)

Four functions handle all API communication:

#### callAPI

```javascript
async function callAPI(config, body) → Promise<object>
```

Standard POST to `/interactions`. Throws `APIError` on non-2xx responses.

#### callAPIStream

```javascript
async function callAPIStream(config, body) → Promise<void>
```

POST to `/interactions?alt=sse` with `stream: true` in body. Reads the response as a stream, parses SSE events line by line, and writes text deltas directly to stdout.

The SSE parser maintains a buffer and splits on newlines. It tracks the current `event:` type and only processes `data:` lines when the event type is `content.delta`. Empty lines reset the event type (SSE event boundary).

**Current limitation:** Only text deltas are extracted during streaming. Images and audio from streaming responses are not captured.

#### extractOutputs

```javascript
function extractOutputs(response) → { text: string[], images: [], audio: [], functions: [] }
```

Categorizes the `outputs` array from a non-streaming response by type. Used by all command handlers to process results.

#### pollCompletion

```javascript
async function pollCompletion(config, id) → Promise<object>
```

Polls `GET /interactions/{id}` every 5 seconds until status is `completed`, `failed`, or `cancelled`. Prints status updates to stderr. Used by the `research` command.

### Section 7: File Handling (lines 402-481)

#### Output Pipeline

1. `ensureDir()` — creates output directory recursively if needed
2. `sanitize()` — strips non-alphanumeric chars from filenames, limits to 60 chars
3. `uniquePath()` — appends `_1`, `_2`, etc. to avoid overwriting existing files
4. `saveOutput()` — decodes base64, converts PCM→WAV if needed, writes file
5. `openFile()` — platform-aware file opener (`open` on macOS, `xdg-open` on Linux, `start` on Windows)

#### MIME Type Mapping

Two lookup tables:
- `MIME_EXT` — MIME type → file extension (for saving outputs)
- `EXT_MIME` — file extension → MIME type (for reading inputs)
- `inputType()` — MIME type → Interactions API content type (`image`, `audio`, `video`, `document`)

#### WAV Header Construction

The `createWav()` function builds a 44-byte WAV header for raw PCM audio. Parameters:
- Sample rate: 24000 Hz (Gemini TTS default)
- Channels: 1 (mono)
- Bits per sample: 16

This avoids requiring ffmpeg or any audio library. The WAV header format is:
```
Bytes 0-3:   "RIFF"
Bytes 4-7:   File size - 8
Bytes 8-11:  "WAVE"
Bytes 12-15: "fmt "
Bytes 16-19: 16 (fmt chunk size)
Bytes 20-21: 1 (PCM format)
Bytes 22-23: Channel count
Bytes 24-27: Sample rate
Bytes 28-31: Byte rate
Bytes 32-33: Block align
Bytes 34-35: Bits per sample
Bytes 36-39: "data"
Bytes 40-43: Data size
```

### Section 8: Prompt Builders (lines 483-556)

Functions that engineer prompts for specialized image generation presets. See [Prompt Engineering](prompt-engineering.md) for details.

### Section 9: Command Handlers (lines 569-890)

Each command has a handler function:

| Handler | Command | Notes |
|---------|---------|-------|
| `handlePrompt` | `prompt` | Supports `--file`, `--system`, `--schema`, `--stream` |
| `handleImage` | `image` | Dispatches to 7 sub-commands |
| `handleTTS` | `tts` | Saves WAV files |
| `handleSearch` | `search` | Adds Google Search tool |
| `handleResearch` | `research` | Uses agent + background polling |
| `handleRaw` | `raw` | Reads from arg, `--file`, or stdin |

All handlers follow the same pattern:
1. Validate required inputs
2. Build request body
3. Call API (or stream)
4. Process and output results

### Section 10: Main Dispatch (lines 892-979)

#### Argument Parsing

Uses `parseArgs` from `node:util` with `strict: false` and `allowPositionals: true`. All options are defined with their types (string or boolean) so parseArgs handles `--key=value` and `--flag` syntax.

#### Command Detection

```
argv → parseArgs → positionals + values
                     ↓
              positionals[0] in COMMANDS?
              ├── yes → command = positionals[0], shift it off
              └── no  → command stays null
                          ↓
              values.help? → showHelp(command)  // null = main help
                          ↓
              command = 'prompt'  // default
```

This allows both `tiny-gemini "hello"` and `tiny-gemini prompt "hello"` to work identically.

## Data Flow

### Non-Streaming Request

```
User input → parseArgs → resolveConfig → handler
  → callAPI(config, body)
    → fetch POST /interactions
    → parse JSON response
  → extractOutputs(response)
  → print text to stdout
  → save images/audio to output dir
```

### Streaming Request

```
User input → parseArgs → resolveConfig → handler
  → callAPIStream(config, body)
    → fetch POST /interactions?alt=sse
    → read stream chunks
    → parse SSE events
    → write text deltas to stdout in real-time
```

### Background Task (Research)

```
User input → parseArgs → resolveConfig → handleResearch
  → callAPI(config, { agent, input, background: true })
  → get interaction ID from response
  → pollCompletion(config, id)
    → loop: GET /interactions/{id} every 5s
    → print status to stderr
    → on "completed": return full response
  → extractOutputs(result)
  → print text to stdout
```

## How to Add a New Command

### Step 1: Register the Command

Add the command name to the `COMMANDS` array (line ~23):

```javascript
const COMMANDS = ['prompt', 'image', 'tts', 'search', 'research', 'raw', 'mycommand'];
```

### Step 2: Add Help Text

Create a `HELP_MYCOMMAND` constant and add it to `HELP_MAP`:

```javascript
const HELP_MYCOMMAND = `...`.trim();
// In HELP_MAP:
const HELP_MAP = { ..., mycommand: HELP_MYCOMMAND };
```

Also add a one-line entry to `HELP_MAIN`.

### Step 3: Create the Handler

```javascript
async function handleMyCommand(input, values, config) {
    const model = config.model || MODELS.text;
    const body = { model, input };
    // ... customize body ...
    const response = await callAPI(config, body);
    const out = extractOutputs(response);
    for (const t of out.text) console.log(t);
}
```

### Step 4: Add to Dispatch

In the `main()` function's switch statement:

```javascript
case 'mycommand': await handleMyCommand(args.join(' '), values, config); break;
```

### Step 5: Add Options (if needed)

Add any new options to the `parseArgs` options object in `main()`:

```javascript
'my-option': { type: 'string' },
```

## How to Add an Image Sub-Command

1. Add to `IMAGE_SUBS` array
2. Add a `case` in the `handleImage` switch statement
3. Optionally add a prompt builder function in the Prompt Builders section
4. Update `HELP_IMAGE` text

## Key Design Decisions

### Why Interactions API (not generateContent)

The Interactions API is the newer, unified endpoint that supports models, agents, tools, streaming, background tasks, and stateful conversations through a single interface. The older `generateContent` API requires different endpoints for different features.

### Why x-goog-api-key Header (not URL param)

More secure — the API key doesn't appear in server logs, proxy logs, or browser history. This matches the Interactions API's documented convention.

### Why Inline WAV Construction

TTS responses come as raw PCM audio. Rather than requiring ffmpeg or an audio library, we construct the 44-byte WAV header inline. This keeps the zero-dependency promise.

### Why Per-Command Model Defaults

Different tasks require different models. Text uses `gemini-2.5-flash` (fastest text model), image generation uses `gemini-2.5-flash-image` (image-capable), TTS uses the TTS-specific model, and research uses the Deep Research agent. Users can override any default with `--model`.

### Why strict: false in parseArgs

Different commands use different options. With `strict: true`, unknown options cause errors. `strict: false` allows any command to accept any combination of flags without errors for unused options.

## Error Handling

### APIError Class

Wraps HTTP errors with the API's error message. Parses the response body to extract `error.message` from JSON error responses, or truncates raw text responses to 500 chars.

### stderr vs stdout Convention

- **stdout** — command output (text responses, JSON). Pipeable.
- **stderr** — status messages (`log()`), progress updates, errors (`die()`), file save confirmations. Not captured by pipes.

This lets you pipe output cleanly: `tiny-gemini "summarize" --file doc.pdf > summary.txt`
