# Gemini Interactions API Reference

This document covers the external API that `tiny-gemini` wraps. All requests go through the Gemini Interactions API — a single unified endpoint that replaces the older `generateContent` API.

**Official docs:**
- [Interactions API](https://ai.google.dev/gemini-api/docs/interactions) — local snapshot: [20260307-gemini/interactions.md](20260307-gemini/interactions.md)
- [Image Generation](https://ai.google.dev/gemini-api/docs/image-generation) — local snapshot: [20260307-gemini/image-generation.md](20260307-gemini/image-generation.md)

## Table of Contents

- [Endpoint and Authentication](#endpoint-and-authentication)
  - [Base URL](#base-url)
  - [Authentication Header](#authentication-header)
  - [Operations](#operations)
- [Request Body](#request-body)
  - [Top-Level Fields](#top-level-fields)
  - [Input Format](#input-format)
    - [Simple Text](#simple-text)
    - [Multimodal Content Array](#multimodal-content-array)
    - [Supported Content Types](#supported-content-types)
  - [Generation Config](#generation-config)
    - [Thinking Levels](#thinking-levels)
    - [Image Config](#image-config)
    - [Speech Config](#speech-config)
  - [Tools](#tools)
    - [Google Search](#google-search)
    - [Function Calling](#function-calling)
    - [Other Built-in Tools](#other-built-in-tools)
  - [System Instruction](#system-instruction)
  - [Response Format (Structured Output)](#response-format-structured-output)
  - [Response Modalities](#response-modalities)
- [Response Body](#response-body)
  - [Interaction Object](#interaction-object)
  - [Status Values](#status-values)
  - [Output Types](#output-types)
    - [Text Output](#text-output)
    - [Image Output](#image-output)
    - [Audio Output](#audio-output)
    - [Function Call Output](#function-call-output)
    - [Thought Output](#thought-output)
  - [Usage Object](#usage-object)
- [Streaming (SSE)](#streaming-sse)
  - [Request](#request)
  - [Event Types](#event-types)
  - [Delta Types](#delta-types)
  - [Reconstruction](#reconstruction)
- [Background Tasks and Polling](#background-tasks-and-polling)
  - [Creating a Background Task](#creating-a-background-task)
  - [Polling for Completion](#polling-for-completion)
- [Models and Agents](#models-and-agents)
  - [Text Models](#text-models)
  - [Image Generation Models](#image-generation-models)
  - [TTS Model](#tts-model)
  - [Agents](#agents)
- [Conversation Management](#conversation-management)
  - [Stateful (Server-Side)](#stateful-server-side)
  - [Stateless (Client-Side)](#stateless-client-side)
- [Data Retention](#data-retention)
- [Known Limitations](#known-limitations)

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
| `model` | string | One of model/agent | Model ID (e.g., `gemini-2.5-flash`) |
| `agent` | string | One of model/agent | Agent ID (e.g., `deep-research-pro-preview-12-2025`) |
| `input` | string or Content[] | Yes | Text or multimodal content |
| `response_modalities` | string[] | No | Output types: `["IMAGE"]`, `["AUDIO"]` |
| `generation_config` | object | No | Temperature, thinking, image config, speech config |
| `system_instruction` | string | No | System prompt |
| `response_format` | object | No | JSON schema for structured output |
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
    "image_config": { "aspect_ratio": "16:9", "image_size": "2K" },
    "speech_config": { "language": "en-us", "voice": "kore" }
  }
}
```

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

**Note:** Image size values must use uppercase `K` (e.g., `"2K"` not `"2k"`).

#### Speech Config

```json
{
  "speech_config": {
    "language": "en-us",
    "voice": "kore"
  }
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

### Response Modalities

Controls what type of output the model generates:

| Value | Effect |
|-------|--------|
| `["IMAGE"]` | Generate images |
| `["AUDIO"]` | Generate audio (TTS) |
| `["TEXT", "IMAGE"]` | Interleaved text and images |
| *(not set)* | Text only (default) |

## Response Body

### Interaction Object

```json
{
  "id": "interaction-uuid",
  "model": "gemini-2.5-flash",
  "input": [...],
  "outputs": [...],
  "status": "completed",
  "usage": {
    "prompt_token_count": 123,
    "candidates_token_count": 456,
    "total_tokens": 579
  }
}
```

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

{ "model": "gemini-2.5-flash", "input": "Hello", "stream": true }
```

### Event Types

| Event | Contains | Purpose |
|-------|----------|---------|
| `interaction.start` | `id`, `status` | First event |
| `interaction.status_update` | `status` | Status changes |
| `content.start` | `index`, `content.type` | New output block begins |
| `content.delta` | `delta` object | Incremental content |
| `content.stop` | `index` | Output block ends |
| `interaction.complete` | `id`, `status`, `usage` | Final event (`outputs` is null) |
| `error` | `error.code`, `error.message` | Error |

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

The `interaction.complete` event does **not** include `outputs`. Clients must reconstruct the full response by accumulating `content.delta` events. `tiny-gemini` currently only extracts text deltas during streaming — images and audio from streaming are not supported (use non-streaming mode for those).

## Background Tasks and Polling

### Creating a Background Task

Used for agents like Deep Research:

```json
{
  "agent": "deep-research-pro-preview-12-2025",
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

### Text Models

| Model ID | Notes |
|----------|-------|
| `gemini-2.5-flash` | Fast, default for text/search |
| `gemini-2.5-flash-lite` | Faster, lower quality |
| `gemini-2.5-pro` | Higher quality |
| `gemini-3-flash-preview` | Latest Flash |
| `gemini-3.1-pro-preview` | Latest Pro |

### Image Generation Models

| Model ID | Codename | Notes |
|----------|----------|-------|
| `gemini-2.5-flash-image` | Nano Banana | Speed-optimized, default in tiny-gemini |
| `gemini-3-pro-image-preview` | Nano Banana Pro | Highest quality, advanced reasoning |
| `gemini-3.1-flash-image-preview` | Nano Banana 2 | Newer Flash variant |

All image models output `image/png` as base64. SynthID watermark is embedded in all generated images.

### TTS Model

| Model ID | Notes |
|----------|-------|
| `gemini-2.5-flash-preview-tts` | Outputs raw PCM (24kHz, 16-bit, mono) |

### Agents

| Agent ID | Notes |
|----------|-------|
| `deep-research-pro-preview-12-2025` | Requires `background: true` |

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
- Model family deprecations happen regularly — check [release notes](https://ai.google.dev/gemini-api/docs/changelog) for current model availability
