---
description: The Gemini Interactions API tiny-gemini wraps — endpoint, headers, request/response format, streaming SSE protocol, output types, models, and known limitations.
tags: [api, interactions, streaming, sse, gemini]
source:
  - cli.js
---

# Gemini Interactions API Reference

This document covers the external API that `tiny-gemini` wraps. All requests go through the Gemini Interactions API — a single unified endpoint that replaces the older `generateContent` API.

**Official docs:**
- [Interactions API](https://ai.google.dev/gemini-api/docs/interactions) — local snapshot: [manual/20260307-gemini/interactions.md](manual/20260307-gemini/interactions.md)
- [Image Generation](https://ai.google.dev/gemini-api/docs/image-generation) — local snapshot: [manual/20260307-gemini/image-generation.md](manual/20260307-gemini/image-generation.md)

## Endpoint and Authentication

### Base URL

```
https://generativelanguage.googleapis.com/v1beta
```

### Authentication Header

The Interactions API authenticates via a header (not a URL query parameter):

```
x-goog-api-key: YOUR_API_KEY
```

This is more secure than `?key=` in the URL because the key doesn't appear in server logs or browser history.

### Schema Revision Header

As of May 2026, the API has two response schemas in flight. The CLI sends:

```
Api-Revision: 2026-05-20
```

This opts into the new schema (`steps` array, renamed SSE events). Background:

| Date | Phase |
|------|-------|
| 2026-05-07 | Opt-in available via `Api-Revision: 2026-05-20` |
| 2026-05-26 | New schema becomes the default for REST clients |
| 2026-06-08 | Legacy schema removed; **`Api-Revision` header now ignored** |

As of **2026-06-08** the migration is complete: the legacy schema is gone, the new schema is the only schema, and the API **ignores** the `Api-Revision` header. There is no newer revision value to adopt. The CLI still sends `2026-05-20` as a harmless explicit marker (see `API_REVISION` in `cli.js`); it is inert, and omitting it would make no difference today.

See https://ai.google.dev/gemini-api/docs/interactions-breaking-changes-may-2026 for the full migration matrix.

### Operations

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/v1beta/interactions` | Create interaction |
| `GET` | `/v1beta/interactions/{id}` | Retrieve interaction |
| `GET` | `/v1beta/interactions/{id}?include_input=true` | Retrieve with original input |
| `DELETE` | `/v1beta/interactions/{id}` | Delete interaction |

## Request Body

### Top-Level Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `model` | string | One of model/agent | Model ID (e.g., `gemini-3-flash-preview`) |
| `agent` | string | One of model/agent | Agent ID (e.g., `deep-research-preview-04-2026`) |
| `input` | string or Content[] | Yes | Text or multimodal content |
| `generation_config` | object | No | Temperature, thinking, speech config |
| `system_instruction` | string | No | System prompt |
| `response_format` | object or object[] | No | Declares the output type and its config: `{type:"text",…}` (incl. structured-output schema), `{type:"image",…}` (aspect_ratio/image_size), `{type:"audio"}`. An **array** requests multiple modalities. Replaced the removed `response_modalities` field in the May 2026 migration. |
| `tools` | Tool[] | No | Function calling, search, code execution |
| `previous_interaction_id` | string | No | For stateful conversations |
| `stream` | boolean | No | Enable streaming (default: false) |
| `background` | boolean | No | Run in background (required for agents) |
| `store` | boolean | No | Store interaction server-side (default: true) |

### Input Format

#### Simple Text

```json
{ "input": "What is quantum computing?" }
```

#### Multimodal Content Array

```json
{
  "input": [
    { "type": "text", "text": "Describe this image" },
    { "type": "image", "data": "<base64>", "mime_type": "image/png" }
  ]
}
```

#### Supported Content Types

| Type | Fields | MIME Types |
|------|--------|-----------|
| `text` | `text` | N/A |
| `image` | `data` (base64) or `uri` | `image/png`, `image/jpeg`, `image/webp`, `image/gif` |
| `audio` | `data` (base64) or `uri` | `audio/wav`, `audio/mpeg` |
| `video` | `data` (base64) or `uri` | `video/mp4`, `video/quicktime`, `video/webm` |
| `document` | `data` (base64) or `uri` | `application/pdf` |

### Generation Config

```json
{
  "generation_config": {
    "temperature": 0.7,
    "max_output_tokens": 500,
    "thinking_level": "low",
    "thinking_summaries": "auto",
    "speech_config": [{ "language": "en-us", "voice": "Kore" }]
  }
}
```

**Note:** `image_config` is no longer part of `generation_config` — in the May 2026 schema, `aspect_ratio`/`image_size` live inside `response_format` with `"type": "image"` (see [Image Config](#image-config)). `speech_config` is an array even for a single speaker.

#### Thinking Levels

| Level | Behavior |
|-------|----------|
| `minimal` | Fastest, minimal reasoning (Flash models only) |
| `low` | Light reasoning, prioritizes latency |
| `medium` | Balanced (Flash models only) |
| `high` | Maximum reasoning depth (default) |

#### Image Config

| Field | Values |
|-------|--------|
| `aspect_ratio` | `1:1`, `1:4`, `1:8`, `2:3`, `3:2`, `3:4`, `4:1`, `4:3`, `4:5`, `5:4`, `8:1`, `9:16`, `16:9`, `21:9` |
| `image_size` | `512px` (3.1 Flash only), `1K` (default), `2K`, `4K` |
| `mime_type` | `image/jpeg` (default), `image/png` |

**Note:** Image size values must use uppercase `K` (e.g., `"2K"` not `"2k"`). The value sets are **model-specific**: the four extreme ratios (`1:4`, `1:8`, `4:1`, `8:1`) and `512px` are supported by `gemini-3.1-flash-image` only; `gemini-3-pro-image` and `gemini-3.1-flash-lite-image` take the 10 standard ratios, and `gemini-3.1-flash-lite-image` is 1K-only. See [Gotchas](gotchas.md).

#### Speech Config

`speech_config` is an array of speaker entries, even for a single speaker. Voice names are title-case (e.g. `Kore`, `Zephyr`, `Puck`).

Single speaker:
```json
{
  "speech_config": [
    { "language": "en-us", "voice": "Kore" }
  ]
}
```

Multi-speaker:
```json
{
  "speech_config": [
    { "voice": "Zephyr", "speaker": "Alice", "language": "en-US" },
    { "voice": "Puck", "speaker": "Bob", "language": "en-US" }
  ]
}
```

### Tools

#### Google Search

```json
{ "tools": [{ "type": "google_search" }] }
```

#### Function Calling

```json
{
  "tools": [{
    "type": "function",
    "name": "get_weather",
    "description": "Gets the weather for a location",
    "parameters": {
      "type": "object",
      "properties": { "location": { "type": "string" } },
      "required": ["location"]
    }
  }]
}
```

#### Other Built-in Tools

| Type | Description |
|------|-------------|
| `code_execution` | Python code execution |
| `url_context` | Fetch and analyze web pages |
| `computer_use` | Browser automation |
| `file_search` | Search file stores |
| `mcp_server` | MCP server integration |

### System Instruction

```json
{ "system_instruction": "You are a helpful assistant that responds in haiku." }
```

### Response Format (Structured Output)

```json
{
  "response_format": {
    "type": "object",
    "properties": {
      "name": { "type": "string" },
      "age": { "type": "integer" }
    },
    "required": ["name", "age"]
  }
}
```

The model's text output will be valid JSON conforming to this schema.

### Output Modality (`response_format` type)

The `response_modalities` field was **removed** in the May 2026 migration (legacy schema gone 2026-06-08). Output type is now declared by the `type` of a `response_format` entry — see [Gotchas](gotchas.md):

| Goal | `response_format` |
|------|-------------------|
| Text (default) | *(not set)*, or `{ "type": "text" }` |
| Structured JSON | `{ "type": "text", "mime_type": "application/json", "schema": {…} }` |
| Image | `{ "type": "image", "aspect_ratio": "…", "image_size": "…" }` |
| Audio (TTS) | `{ "type": "audio" }` (with `generation_config.speech_config`) |
| Video | `{ "type": "video", "delivery": "uri", "aspect_ratio": "16:9" }` (Gemini Omni; `delivery:"uri"` returns a downloadable file URI, `9:16` also supported) |
| Multiple (e.g. text + image) | an **array**: `[ { "type": "text" }, { "type": "image" } ]` |

## Response Body

### Interaction Object

Post-2026-05 schema (default after 2026-05-26):

```json
{
  "id": "interaction-uuid",
  "model": "gemini-3-flash-preview",
  "input": [...],
  "steps": [
    {
      "type": "model_turn",
      "content": [
        { "type": "text", "text": "The answer is..." }
      ]
    }
  ],
  "status": "completed",
  "usage": {
    "prompt_token_count": 123,
    "candidates_token_count": 456,
    "total_tokens": 579
  }
}
```

Legacy schema (removed 2026-06-08):

```json
{
  "id": "interaction-uuid",
  "outputs": [
    { "type": "text", "text": "The answer is..." }
  ],
  ...
}
```

`tiny-gemini`'s `extractOutputs()` reads either shape so the CLI keeps working through the transition.

### Status Values

| Status | Meaning |
|--------|---------|
| `in_progress` | Still processing |
| `completed` | Successfully finished |
| `requires_action` | Waiting for tool execution result |
| `failed` | Error occurred |
| `cancelled` | Cancelled by user or system |

### Output Types

#### Text Output

```json
{ "type": "text", "text": "The answer is..." }
```

#### Image Output

```json
{ "type": "image", "data": "<base64-png>", "mime_type": "image/png" }
```

#### Audio Output

```json
{ "type": "audio", "data": "<base64-pcm>", "mime_type": "audio/pcm" }
```

Audio is raw PCM: 16-bit signed little-endian, 24kHz, mono. Requires WAV header to be playable (see [Architecture: WAV Construction](architecture.md#wav-header-construction)).

#### Video Output

With `response_format: { "type": "video", "delivery": "uri" }` (Gemini Omni), the video is returned as a downloadable file URI:

```json
{ "type": "video", "mime_type": "video/mp4", "uri": "https://generativelanguage.googleapis.com/v1beta/files/<id>:download?alt=media" }
```

The download endpoint 302-redirects to a signed media URL — fetch the URI with the `x-goog-api-key` header and follow the redirect. Without `delivery: "uri"` (or for small clips) the part may instead carry inline base64 `data`. The interaction completes synchronously — the URI is ready when `status` is `completed` (no background polling). `tiny-gemini`'s `video` command handles both shapes (`downloadVideoFile` in `cli.js`).

#### Function Call Output

```json
{
  "type": "function_call",
  "id": "call-id-123",
  "name": "get_weather",
  "arguments": { "location": "Paris" }
}
```

To send the result back:
```json
{
  "previous_interaction_id": "interaction-id",
  "input": [{
    "type": "function_result",
    "name": "get_weather",
    "call_id": "call-id-123",
    "result": "Sunny, 22C"
  }]
}
```

#### Thought Output

```json
{ "type": "thought", "summary": "Reasoning about the problem..." }
```

### Usage Object

```json
{
  "prompt_token_count": 123,
  "candidates_token_count": 456,
  "total_tokens": 579
}
```

## Streaming (SSE)

### Request

Append `?alt=sse` to the URL and include `"stream": true` in the body:

```
POST /v1beta/interactions?alt=sse
Content-Type: application/json
x-goog-api-key: YOUR_KEY

{ "model": "gemini-3-flash-preview", "input": "Hello", "stream": true }
```

### Event Types

Post-2026-05 schema (the CLI emits these via `Api-Revision: 2026-05-20`):

| Event | Contains | Purpose |
|-------|----------|---------|
| `interaction.created` | `id`, `status` | First event (was `interaction.start`) |
| `interaction.in_progress` / `interaction.requires_action` / etc. | `status` | Status changes (was `interaction.status_update`) |
| `step.start` | `index`, `step.type` | New step begins (was `content.start`) |
| `step.delta` | `delta` object | Incremental content (was `content.delta`) |
| `step.stop` | `index` | Step ends (was `content.stop`) |
| `interaction.completed` | `id`, `status`, `usage` | Final event, `steps` is null (was `interaction.complete`) |
| `interaction.error` | `error.code`, `error.message` | Error (was `error`) |

The CLI's SSE parser accepts both `step.delta` and the legacy `content.delta` event names, so it stays functional during the transition window.

### Delta Types

```
event: content.delta
data: {"delta": {"type": "text", "text": "chunk of text"}}

event: content.delta
data: {"delta": {"type": "thought", "thought": "reasoning..."}}

event: content.delta
data: {"delta": {"type": "function_call", "id": "...", "name": "...", "arguments": {...}}}
```

### Reconstruction

The `interaction.completed` event does **not** include `steps`. Clients must reconstruct the full response by accumulating `step.delta` events. `tiny-gemini` currently only extracts text deltas during streaming — images and audio from streaming are not supported (use non-streaming mode for those).

## Background Tasks and Polling

### Creating a Background Task

Used for agents like Deep Research:

```json
{
  "agent": "deep-research-preview-04-2026",
  "input": "Research topic...",
  "background": true
}
```

Returns immediately with `id` and `status: "in_progress"`.

### Polling for Completion

```
GET /v1beta/interactions/{id}
x-goog-api-key: YOUR_KEY
```

Poll every 5 seconds. Check `status` field:
- `in_progress` → keep polling
- `completed` → extract `outputs`
- `failed` / `cancelled` → report error

## Models and Agents

For the live registry, run `npx tiny-gemini models`. See [Model Selection](model-selection.md) for the decision rules and full pricing.

### Text Models

| Model ID | Notes |
|----------|-------|
| `gemini-3-flash-preview` | Default for text/search in tiny-gemini, best value |
| `gemini-3.5-flash` | GA — Google's recommended latest flash (agentic/coding); official replacement for `gemini-2.5-flash` |
| `gemini-3.1-pro-preview` | Most capable, deepest reasoning |
| `gemini-3.1-flash-lite` | Cheapest text in the Gemini 3 family (GA) |
| `gemini-2.5-flash` | Remote MCP support — **sunset 2026-10-16** |
| `gemini-2.5-pro` | **Sunset 2026-10-16**, → `gemini-3.1-pro-preview` |
| `gemini-2.5-flash-lite` | **Sunset 2026-10-16**, → `gemini-3.1-flash-lite` |

### Image Generation Models

| Model ID | Codename | Notes |
|----------|----------|-------|
| `gemini-3.1-flash-image` | Nano Banana 2 | Default in tiny-gemini, best value, up to 4K. Only model with `512px` + the extreme `1:4/1:8/4:1/8:1` ratios |
| `gemini-3.1-flash-lite-image` | Nano Banana 2 Lite | GA 2026-06-30. Fastest/cheapest, **1K only**, 10 standard ratios. Successor to `gemini-2.5-flash-image` |
| `gemini-3-pro-image` | Nano Banana Pro | Highest quality, best text rendering |
| `gemini-2.5-flash-image` | Nano Banana | **Deprecated** (shutdown 2026-10-02) → `gemini-3.1-flash-lite-image` |

Image models return base64 image data; the GA models (`gemini-3.1-flash-image`, `gemini-3-pro-image`) return `image/jpeg`. The CLI saves using whatever `mime_type` the response carries, so the file extension always matches the actual format. A SynthID watermark is embedded in all generated images.

### Audio Models

| Model ID | Notes |
|----------|-------|
| `gemini-3.1-flash-tts-preview` | TTS default. Outputs raw PCM (24kHz, 16-bit, mono). Streaming supported by the API (2026-06-17); the CLI's `tts` writes a non-streaming WAV |
| `gemini-2.5-flash-preview-tts` | Preview (not deprecated) — older, lower-cost 2.5-family TTS → prefer `gemini-3.1-flash-tts-preview` |
| `gemini-2.5-pro-preview-tts` | Preview — higher-tier 2.5-family TTS → prefer `gemini-3.1-flash-tts-preview` |
| `gemini-2.5-flash-native-audio-preview-12-2025` | Native speech-in / speech-out (distinct from TTS) |

### Video Models

| Model ID | Codename | Notes |
|----------|----------|-------|
| `gemini-omni-flash-preview` | Omni Flash | Default in tiny-gemini's `video` command. Text/image → 720p 24fps MP4 (3–10s), plus conversational video editing (video input up to 10s). Preview. Video output ≈ $0.10/second. SynthID-watermarked |

Note: **Veo 3.1** (`veo-3.1-generate-preview` / `-lite`) is a *separate* higher-fidelity video family that uses a different long-running endpoint (`:predictLongRunning`), not the Interactions API — reachable via `raw` with a custom `--api-base`/body, not the `video` command.

### Embeddings

| Model ID | Notes |
|----------|-------|
| `gemini-embedding-2` | Multimodal (text, image, video, audio, PDF). Accessed via `/embeddings` or via `raw` |

### Agents

| Agent ID | Notes |
|----------|-------|
| `deep-research-preview-04-2026` | Default research agent. Requires `background: true` |
| `deep-research-max-preview-04-2026` | Comprehensive variant. Requires `background: true` |

## Conversation Management

### Stateful (Server-Side)

Use `previous_interaction_id` to continue a conversation. The server preserves history, but you must re-specify per-interaction parameters:
- `tools`
- `system_instruction`
- `generation_config`

### Stateless (Client-Side)

Pass the full conversation history as a Content array with roles. Not currently implemented in `tiny-gemini`.

## Data Retention

| Tier | Retention |
|------|-----------|
| Paid | 55 days |
| Free | 1 day |

Set `store: false` to opt out (incompatible with `background: true`).

## Known Limitations

- Google Maps grounding not supported
- Tool combinations (MCP + Function Call + Built-in) not supported simultaneously
- Gemini 3 lacks remote MCP support
- Content ordering may be incorrect with search/URL tools (text may appear before tool execution)
- No multi-image output per call — image generation returns exactly one image; there is no `candidate_count`/`sample_count`/`number_of_images` parameter (that belongs to the separate Imagen `:predict` API). N variations require N requests (the CLI fans them out concurrently). See [Gotchas](gotchas.md).
- Model family deprecations happen regularly — check [release notes](https://ai.google.dev/gemini-api/docs/changelog) for current model availability
