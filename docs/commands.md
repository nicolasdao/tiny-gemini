# Command Reference

Complete reference for every command, sub-command, and option. Includes the exact request bodies sent to the Gemini Interactions API and how responses are processed.

## Table of Contents

- [prompt](#prompt)
  - [Basic Usage](#basic-usage)
  - [Multimodal Input (--file)](#multimodal-input---file)
  - [Prompt Files (--prompt-file)](#prompt-files---prompt-file)
  - [Output File (--output-file)](#output-file---output-file)
  - [System Instructions (--system)](#system-instructions---system)
  - [Structured Output (--schema)](#structured-output---schema)
  - [Streaming (--stream)](#streaming---stream)
  - [Request Bodies](#request-bodies)
    - [Text-Only Request](#text-only-request)
    - [Multimodal Request](#multimodal-request)
    - [With Prompt Files](#with-prompt-files)
    - [With System Instruction](#with-system-instruction)
    - [With Schema](#with-schema)
- [image](#image)
  - [Sub-Command Dispatch](#sub-command-dispatch)
  - [generate](#generate)
    - [Single Image](#single-image)
    - [Batch with --count](#batch-with---count)
    - [Batch with --styles](#batch-with---styles)
    - [Batch with --variations](#batch-with---variations)
    - [Generate Request Body](#generate-request-body)
  - [edit](#edit)
    - [Edit Request Body](#edit-request-body)
  - [describe](#describe)
    - [Describe Request Body](#describe-request-body)
  - [story](#story)
    - [Story Request Body](#story-request-body)
  - [icon](#icon)
    - [Icon Options](#icon-options)
  - [pattern](#pattern)
    - [Pattern Options](#pattern-options)
  - [diagram](#diagram)
    - [Diagram Options](#diagram-options)
  - [Image Config Options](#image-config-options)
    - [Aspect Ratio](#aspect-ratio)
    - [Image Size](#image-size)
- [tts](#tts)
  - [TTS Options](#tts-options)
  - [TTS Request Body](#tts-request-body)
  - [TTS Output Format](#tts-output-format)
- [search](#search)
  - [Search Options](#search-options)
  - [Search Request Body](#search-request-body)
  - [Search Response Handling](#search-response-handling)
- [research](#research)
  - [Research Request Body](#research-request-body)
  - [Research Polling Flow](#research-polling-flow)
- [raw](#raw)
  - [Input Sources](#input-sources)
  - [Raw Request Handling](#raw-request-handling)

## prompt

Default command — if the first positional argument isn't a known command name, it's treated as a prompt.

Default model: `gemini-3-flash-preview`

### Basic Usage

```bash
tiny-gemini "What is quantum computing?"
tiny-gemini prompt "What is quantum computing?"   # identical
```

### Multimodal Input (--file)

Attach an image, audio, video, or PDF file to the prompt:

```bash
tiny-gemini "Describe this" --file photo.png
tiny-gemini "Summarize" --file doc.pdf
tiny-gemini "Transcribe this" --file recording.mp3
```

The file is read, base64-encoded, and sent as an inline content part. The MIME type is detected from the file extension. Supported extensions: `.png`, `.jpg`, `.jpeg`, `.webp`, `.gif`, `.pdf`, `.mp3`, `.wav`, `.mp4`, `.mov`, `.webm`.

### Prompt Files (--prompt-file)

Inject text file contents into the prompt without the agent needing to read them. Repeatable for multiple files:

```bash
tiny-gemini "Fix bugs in this code" --prompt-file src/app.js
tiny-gemini "Compare these files" --prompt-file a.js --prompt-file b.js
tiny-gemini --prompt-file src/app.js --system "Explain this code"
```

Each file is read as UTF-8 and wrapped with filename delimiters:

```
--- FILE: src/app.js ---
<file contents>
--- END FILE: src/app.js ---
```

The file contents are appended after the user's text prompt (if any). `--prompt-file` can be used without a text prompt — the file contents become the entire prompt. It can also be combined with `--file` (which sends binary content as base64 multimodal data).

### Output File (--output-file)

Write the response to a file instead of printing to stdout. The CLI prints only a short summary:

```bash
tiny-gemini "What is 2+2?" --output-file answer.txt
# Stdout: "Response written to answer.txt"

tiny-gemini "Fix this code" --prompt-file app.js --output-file result.json --output-format=manifest
# Stdout: "Manifest written to result.json (2 text blocks, 150 lines)"
```

Use `--output-format` to force `plain` (text file) or `manifest` (JSON with file references). Without it, the CLI auto-detects: manifest mode is used when the response contains function calls or any text block exceeds 4000 characters. See [README: Agentic Workflow](../README.md#agentic-workflow---prompt-file---output-file) for the full manifest format and smart detection rules.

Works with `--stream` — text chunks are accumulated silently and written at the end.

### System Instructions (--system)

```bash
tiny-gemini "Tell me about dogs" --system "You are a veterinarian. Be concise."
```

### Structured Output (--schema)

Pass a JSON schema (inline or file path) to get structured JSON responses:

```bash
# Inline JSON schema
tiny-gemini "Extract name and age from: John is 30" \
  --schema '{"type":"object","properties":{"name":{"type":"string"},"age":{"type":"integer"}}}'

# Schema from file
tiny-gemini "Analyze this text" --schema schema.json
```

### Streaming (--stream)

```bash
tiny-gemini "Write a short story" --stream
```

Text is printed to stdout as it's generated, token by token.

### Request Bodies

#### Text-Only Request

```json
{
  "model": "gemini-3-flash-preview",
  "input": "What is quantum computing?"
}
```

#### Multimodal Request

```json
{
  "model": "gemini-3-flash-preview",
  "input": [
    { "type": "text", "text": "Describe this" },
    { "type": "image", "data": "<base64>", "mime_type": "image/png" }
  ]
}
```

#### With Prompt Files

When `--prompt-file` is used, file contents are appended to the text prompt with delimiters. The resulting input sent to the API:

```json
{
  "model": "gemini-3-flash-preview",
  "input": "Fix bugs in this code\n\n--- FILE: src/app.js ---\n<file contents>\n--- END FILE: src/app.js ---"
}
```

When combined with `--file` (multimodal), the prompt-file content is included in the text part of the content array.

#### With System Instruction

```json
{
  "model": "gemini-3-flash-preview",
  "input": "Tell me about dogs",
  "system_instruction": "You are a veterinarian. Be concise."
}
```

#### With Schema

```json
{
  "model": "gemini-3-flash-preview",
  "input": "Extract name and age from: John is 30",
  "response_format": {
    "type": "object",
    "properties": {
      "name": { "type": "string" },
      "age": { "type": "integer" }
    }
  }
}
```

## image

Image generation, editing, and understanding. Has 7 sub-commands.

Default model: `gemini-3.1-flash-image-preview` (except `describe`, which uses `gemini-3-flash-preview`)

### Sub-Command Dispatch

If the first argument after `image` is a recognized sub-command, it's used. Otherwise, defaults to `generate`:

```bash
tiny-gemini image "a cat"                    # → generate
tiny-gemini image generate "a cat"           # → generate (explicit)
tiny-gemini image edit photo.png "add hat"   # → edit
```

### generate

Generate one or more images from a text prompt.

#### Single Image

```bash
tiny-gemini image "a yellow banana wearing sunglasses"
```

#### Batch with --count

Generate N images of the same prompt:

```bash
tiny-gemini image "a cat" --count=3
```

#### Batch with --styles

Apply different artistic styles to the same prompt:

```bash
tiny-gemini image "a mountain" --styles=watercolor,sketch,oil-painting
```

Common styles: `photorealistic`, `watercolor`, `oil-painting`, `sketch`, `pixel-art`, `anime`, `vintage`, `modern`, `abstract`, `minimalist`.

#### Batch with --variations

Apply paired variations from the variation map:

```bash
tiny-gemini image "a forest" --variations=lighting,season
```

Each variation generates 2 images (e.g., lighting → "dramatic lighting" + "soft lighting"). Available variations: `lighting`, `angle`, `color-palette`, `composition`, `mood`, `season`, `time-of-day`.

Styles and variations can be combined. `--count` limits total output.

#### Generate Request Body

```json
{
  "model": "gemini-3.1-flash-image-preview",
  "input": "a yellow banana wearing sunglasses",
  "response_modalities": ["IMAGE"]
}
```

With image config:
```json
{
  "model": "gemini-3.1-flash-image-preview",
  "input": "a yellow banana wearing sunglasses",
  "response_modalities": ["IMAGE"],
  "generation_config": {
    "image_config": {
      "aspect_ratio": "16:9",
      "image_size": "2K"
    }
  }
}
```

### edit

Edit an existing image with a text prompt.

```bash
tiny-gemini image edit photo.png "add sunglasses"
tiny-gemini image edit logo.png "change the background to blue"
```

The first argument after `edit` is the file path, the rest is the edit prompt.

#### Edit Request Body

```json
{
  "model": "gemini-3.1-flash-image-preview",
  "input": [
    { "type": "text", "text": "add sunglasses" },
    { "type": "image", "data": "<base64>", "mime_type": "image/png" }
  ],
  "response_modalities": ["IMAGE"]
}
```

### describe

Image understanding — analyze an image with an optional question.

```bash
tiny-gemini image describe photo.png
tiny-gemini image describe photo.png "What breed is this dog?"
```

Uses the **text model** (`gemini-3-flash-preview`), not the image generation model. Supports `--stream`.

#### Describe Request Body

```json
{
  "model": "gemini-3-flash-preview",
  "input": [
    { "type": "text", "text": "Describe this image in detail" },
    { "type": "image", "data": "<base64>", "mime_type": "image/png" }
  ]
}
```

### story

Generate a multi-step image sequence.

```bash
tiny-gemini image story "a seed growing into a tree" --steps=4
tiny-gemini image story "building a house" --type=process --steps=6
```

Each step is generated as a separate API call with a prompt engineered for sequential coherence. See [Prompt Engineering: Story](prompt-engineering.md#story-sequence) for details.

#### Story Request Body

Each step sends:
```json
{
  "model": "gemini-3.1-flash-image-preview",
  "input": "a seed growing into a tree, step 2 of 4, narrative sequence, consistent art style, smooth transition from previous step",
  "response_modalities": ["IMAGE"]
}
```

### icon

Generate an icon with prompt engineering for clean, professional results.

```bash
tiny-gemini image icon "coffee cup"
tiny-gemini image icon "music note" --style=flat --type=favicon
```

#### Icon Options

| Option | Values | Default |
|--------|--------|---------|
| `--style` | `modern`, `flat`, `skeuomorphic`, `minimal` | `modern` |
| `--type` | `app-icon`, `favicon`, `ui-element` | `app-icon` |
| `--background` | `transparent`, `white`, `black`, any color | `transparent` |
| `--corners` | `rounded`, `sharp` | `rounded` |

### pattern

Generate a repeating pattern or texture.

```bash
tiny-gemini image pattern "geometric shapes"
tiny-gemini image pattern "floral" --type=wallpaper --style=organic --colors=mono
```

#### Pattern Options

| Option | Values | Default |
|--------|--------|---------|
| `--type` | `seamless`, `texture`, `wallpaper` | `seamless` |
| `--style` | `geometric`, `organic`, `abstract`, `floral`, `tech` | `abstract` |
| `--density` | `sparse`, `medium`, `dense` | `medium` |
| `--colors` | `mono`, `duotone`, `colorful` | `colorful` |

### diagram

Generate a technical diagram.

```bash
tiny-gemini image diagram "user authentication flow"
tiny-gemini image diagram "microservices architecture" --type=architecture --layout=horizontal
```

#### Diagram Options

| Option | Values | Default |
|--------|--------|---------|
| `--type` | `flowchart`, `architecture`, `network`, `database`, `wireframe`, `mindmap`, `sequence` | `flowchart` |
| `--style` | `professional`, `clean`, `hand-drawn`, `technical` | `professional` |
| `--layout` | `horizontal`, `vertical`, `hierarchical`, `circular` | `hierarchical` |
| `--complexity` | `simple`, `detailed`, `comprehensive` | `detailed` |
| `--colors` | `mono`, `accent`, `categorical` | `accent` |
| `--annotations` | `minimal`, `detailed` | `detailed` |

### Image Config Options

These options apply to all image generation sub-commands (generate, edit, story, icon, pattern, diagram):

#### Aspect Ratio

```bash
tiny-gemini image "landscape" --aspect-ratio=16:9
```

Values: `1:1`, `1:4`, `1:8`, `2:3`, `3:2`, `3:4`, `4:1`, `4:3`, `4:5`, `5:4`, `8:1`, `9:16`, `16:9`, `21:9`

#### Image Size

```bash
tiny-gemini image "detailed scene" --image-size=2K
```

Values: `512px` (gemini-3.1-flash only), `1K` (default), `2K`, `4K`. Must use uppercase `K`.

## tts

Text-to-speech. Generates audio and saves as a `.wav` file.

Default model: `gemini-2.5-flash-preview-tts`

```bash
tiny-gemini tts "Hello, how are you today?"
tiny-gemini tts "Bonjour le monde" --voice=kore --language=fr-fr
```

### TTS Options

| Option | Default | Description |
|--------|---------|-------------|
| `--voice` | `kore` | Voice name |
| `--language` | `en-us` | Language code |

### TTS Request Body

```json
{
  "model": "gemini-2.5-flash-preview-tts",
  "input": "Hello, how are you today?",
  "response_modalities": ["AUDIO"],
  "generation_config": {
    "speech_config": {
      "language": "en-us",
      "voice": "kore"
    }
  }
}
```

### TTS Output Format

The API returns `audio/pcm` (raw 16-bit, 24kHz, mono PCM). The CLI converts this to WAV by prepending a 44-byte header before saving. Output files are named `tts_<text-snippet>.wav`.

## search

Google Search-grounded generation. The model can search the web to answer questions about current events.

Default model: `gemini-3-flash-preview`

```bash
tiny-gemini search "Who won the 2026 Super Bowl?"
tiny-gemini search "latest React release" --stream
tiny-gemini search "AI news" --output-file results.txt
```

### Search Options

| Option | Description |
|--------|-------------|
| `--output-file <path>` | Write response to file instead of stdout |
| `--output-format <fmt>` | Output format: `plain` or `manifest` (default: auto) |
| `--stream` | Stream the response |
| `--model <model>` | Model override |

### Search Request Body

```json
{
  "model": "gemini-3-flash-preview",
  "input": "Who won the 2026 Super Bowl?",
  "tools": [{ "type": "google_search" }]
}
```

### Search Response Handling

The response may contain both text outputs and search metadata. The CLI extracts and prints only text outputs — search result metadata is filtered out.

## research

Deep Research agent. Submits a research topic and polls for completion.

Default agent: `deep-research-pro-preview-12-2025`

```bash
tiny-gemini research "History of Google TPUs focusing on 2025-2026"
```

### Research Request Body

```json
{
  "agent": "deep-research-pro-preview-12-2025",
  "input": "History of Google TPUs focusing on 2025-2026",
  "background": true
}
```

Note: uses `agent` field instead of `model`. `background: true` is required.

### Research Polling Flow

1. POST creates the interaction → returns `id` with `status: "in_progress"`
2. Poll `GET /interactions/{id}` every 5 seconds
3. Print status updates to stderr
4. On `completed`: extract and print the research report
5. On `failed`/`cancelled`: exit with error

Research tasks can take several minutes. Status updates are printed to stderr so the final report can be piped.

## raw

JSON passthrough. Sends any JSON body directly to the Interactions API and prints the raw JSON response. This is the escape hatch for any API feature not covered by the dedicated commands (function calling, MCP, code execution, computer use, etc.).

```bash
tiny-gemini raw '{"model":"gemini-3-flash-preview","input":"hello"}'
```

### Input Sources

The JSON body can come from three sources (checked in this order):

1. **CLI argument**: `tiny-gemini raw '{"model":"...","input":"..."}'`
2. **--file flag**: `tiny-gemini raw --file request.json`
3. **stdin**: `echo '{"json":"..."}' | tiny-gemini raw`

### Raw Request Handling

The JSON body is sent directly to `POST /interactions` without any modification. The raw JSON response is printed to stdout with 2-space indentation.
