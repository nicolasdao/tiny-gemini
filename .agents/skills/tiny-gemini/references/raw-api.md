# Raw API and Advanced Patterns

The `raw` command sends any JSON body directly to the Gemini Interactions API. This is the escape hatch for features not covered by dedicated commands.

## Important: Schema Migration (May–June 2026)

The CLI sends the `Api-Revision: 2026-05-20` header on every request, which opts into the new Interactions API schema. Practical effects when you use `raw`:

- **Response shape:** uses `steps` array (not legacy `outputs`). Old code reading `response.outputs[0].text` must read `response.steps[-1].content[0].text`.
- **SSE events:** new event names (`step.delta`, `interaction.created`, `interaction.completed`, `interaction.error`). Legacy `content.delta`, `interaction.start`, `interaction.complete`, `error` are accepted by the CLI's parser but Google's API will only emit the new names.
- **Image config:** lives inside `response_format` with `type: "image"`, NOT inside `generation_config.image_config`.
- **Structured output:** wrap your JSON Schema in `response_format: { type: "text", mime_type: "application/json", schema: {...} }`. Bare schemas as `response_format` are legacy.

The legacy schema is removed by Google on 2026-06-08. Use the new shapes shown throughout this doc.

## Basic Usage

```bash
# Inline JSON
npx tiny-gemini raw '{"model":"gemini-3-flash-preview","input":"hello"}'

# From file
npx tiny-gemini raw --file request.json

# From stdin
echo '{"model":"...","input":"..."}' | npx tiny-gemini raw
```

The JSON body is sent unmodified to `POST /v1beta/interactions`. The CLI adds the `Api-Revision: 2026-05-20` and `x-goog-api-key` headers; everything else is yours. Response is printed as formatted JSON to stdout.

## Discover Available Models

Before constructing a raw body, check what models / agents are currently shipping:

```bash
npx tiny-gemini models list --json                  # everything
npx tiny-gemini models list --type=text --json      # filter by type
npx tiny-gemini models list --type=embeddings --json
npx tiny-gemini models list --type=agent --json     # for the `agent` field
npx tiny-gemini models list --status=deprecated --json   # avoid these
```

Use the `id` field from the JSON output as the `model` (or `agent`) value in your raw body.

## Request Body Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `model` | string | One of model/agent | Model ID (e.g., `gemini-3-flash-preview`) |
| `agent` | string | One of model/agent | Agent ID (e.g., `deep-research-preview-04-2026`) |
| `input` | string or Content[] | Yes | Text or multimodal content |
| `response_modalities` | string[] | No | Output modalities, e.g., `["IMAGE"]`, `["AUDIO"]`, `["TEXT", "IMAGE"]` |
| `response_format` | object | No | Polymorphic. Shape depends on `type`: `text` (with optional `mime_type` + `schema`), `image` (with `aspect_ratio`, `image_size`). Replaces the older bare-schema usage. |
| `generation_config` | object | No | Temperature, thinking, speech config. (Note: `image_config` moved to `response_format`.) |
| `system_instruction` | string | No | System prompt |
| `tools` | Tool[] | No | Function calling, search, code execution, MCP, etc. |
| `previous_interaction_id` | string | No | For multi-turn conversations |
| `stream` | boolean | No | Enable streaming (default: false). The CLI sets this when you pass `--stream`. |
| `background` | boolean | No | Run in background (required for agents) |
| `store` | boolean | No | Store interaction server-side (default: true) |

## Multimodal Input

```json
{
  "model": "gemini-3-flash-preview",
  "input": [
    { "type": "text", "text": "Describe this image" },
    { "type": "image", "data": "<base64>", "mime_type": "image/png" }
  ]
}
```

Content types: `text`, `image`, `audio`, `video`, `document` (PDF).

## Function Calling

```json
{
  "model": "gemini-3-flash-preview",
  "input": "What's the weather in Paris?",
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

To send function results back, use `previous_interaction_id`:

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

## Google Search Tool

```json
{
  "model": "gemini-3-flash-preview",
  "input": "Latest news about AI",
  "tools": [{ "type": "google_search" }]
}
```

## Other Built-in Tools

| Type | Description |
|------|-------------|
| `code_execution` | Python code execution |
| `url_context` | Fetch and analyze web pages |
| `computer_use` | Browser automation |
| `file_search` | Search file stores |
| `mcp_server` | MCP server integration (Gemini 3 models do not support Remote MCP) |

## Generation Config

```json
{
  "generation_config": {
    "temperature": 0.7,
    "max_output_tokens": 500,
    "thinking_level": "low",
    "speech_config": { "language": "en-us", "voice": "kore" }
  }
}
```

Thinking levels: `minimal`, `low`, `medium`, `high` (default).

**Image config moved out of `generation_config`** — see [Image Generation](#image-generation) below.

## Image Generation

The post-2026-05 shape places `aspect_ratio` and `image_size` inside `response_format` with `"type": "image"`:

```json
{
  "model": "gemini-3.1-flash-image-preview",
  "input": "a yellow banana wearing sunglasses",
  "response_modalities": ["IMAGE"],
  "response_format": {
    "type": "image",
    "aspect_ratio": "16:9",
    "image_size": "2K"
  }
}
```

Aspect ratios: `1:1`, `1:4`, `1:8`, `2:3`, `3:2`, `3:4`, `4:1`, `4:3`, `4:5`, `5:4`, `8:1`, `9:16`, `16:9`, `21:9`. Sizes: `512px` (3.1 Flash only), `1K` (default), `2K`, `4K` — uppercase K required.

## Multi-Speaker TTS

```json
{
  "model": "gemini-3.1-flash-tts-preview",
  "input": "Alice: Hello! Bob: Hi there!",
  "response_modalities": ["AUDIO"],
  "generation_config": {
    "speech_config": [
      { "voice": "Zephyr", "speaker": "Alice", "language": "en-US" },
      { "voice": "Puck", "speaker": "Bob", "language": "en-US" }
    ]
  }
}
```

Note: `speech_config` is one of the few config blocks Google did NOT move into `response_format`.

## Structured Output

The post-2026-05 shape wraps the JSON Schema in `response_format` with `type: "text"`, `mime_type: "application/json"`, and `schema`:

```json
{
  "model": "gemini-3-flash-preview",
  "input": "Extract name and age from: John is 30",
  "response_format": {
    "type": "text",
    "mime_type": "application/json",
    "schema": {
      "type": "object",
      "properties": {
        "name": { "type": "string" },
        "age": { "type": "integer" }
      },
      "required": ["name", "age"]
    }
  }
}
```

A bare JSON Schema directly under `response_format` (the pre-2026-05 shape) will not be accepted after the legacy schema is removed.

## Embeddings

`gemini-embedding-2` is GA. Embeddings live behind a separate `/v1beta/embeddings` endpoint, not `/interactions`. Use `--api-base` to redirect, or call directly with curl:

```bash
curl -X POST "https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-2:embedContent" \
  -H "x-goog-api-key: $GEMINI_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"content":{"parts":[{"text":"text to embed"}]}}'
```

The `raw` command sends to `/interactions` only — it cannot reach the embeddings endpoint. For embeddings inside an agent workflow, build the request yourself or wait for a future CLI sub-command.

## Response Body (Post-2026-05 Schema)

The `raw` command prints the full server response. Parse it as:

```json
{
  "id": "interaction-uuid",
  "model": "gemini-3-flash-preview",
  "input": [...],
  "steps": [
    {
      "type": "model_turn",
      "content": [
        { "type": "text", "text": "..." },
        { "type": "image", "data": "<base64>", "mime_type": "image/png" }
      ]
    },
    {
      "type": "function_call",
      "id": "call-id-123",
      "name": "get_weather",
      "arguments": { "location": "Paris" }
    }
  ],
  "status": "completed",
  "usage": { "prompt_token_count": 123, "candidates_token_count": 456, "total_tokens": 579 }
}
```

Common extraction patterns (jq):

```bash
# Get the last text reply
npx tiny-gemini raw '{...}' | jq -r '.steps[-1].content[]? | select(.type=="text") | .text'

# Collect all function calls
npx tiny-gemini raw '{...}' | jq '[.steps[] | select(.type=="function_call")]'

# Get all images as base64 strings
npx tiny-gemini raw '{...}' | jq -r '.steps[].content[]? | select(.type=="image") | .data'
```

If you encounter a response with a top-level `outputs` array instead of `steps`, that's the legacy schema (pre-2026-05-26 default flip / removed 2026-06-08). Each `outputs[]` item carries content directly (`{type, text}` or `{type, data, mime_type}`).

## Step / Content Types

| Step `type` | Shape |
|-------------|-------|
| `model_turn` (or similar) | Has `content[]` array of part objects |
| `function_call` | Has `id`, `name`, `arguments` directly on the step |

| Content `type` | Fields |
|----------------|--------|
| `text` | `text` |
| `image` | `data` (base64-png), `mime_type` |
| `audio` | `data` (base64-pcm), `mime_type` |
| `function_call` | `id`, `name`, `arguments` |
| `thought` | `summary` |

## SSE Streaming Events (Post-2026-05 Names)

When you call `raw` with `"stream": true`, the response is Server-Sent Events:

| Event | When | Carries |
|-------|------|---------|
| `interaction.created` | First event | `id`, `status` |
| `interaction.in_progress` / `interaction.requires_action` | Status changes | `status` |
| `step.start` | New step begins | `index`, `step.type` |
| `step.delta` | Incremental content | `delta` object — typed (`text`, `thought`, `function_call`, ...) |
| `step.stop` | Step ends | `index` |
| `interaction.completed` | Final event | `id`, `status`, `usage` (no `steps` payload) |
| `interaction.error` | Error | `error.code`, `error.message` |

The CLI's own `--stream` flag handles this for you and only emits text deltas to stdout. Use `raw` + your own parser if you need to handle non-text deltas live.

## Multi-Turn Conversations

Use `previous_interaction_id` to chain interactions:

```json
{
  "model": "gemini-3-flash-preview",
  "input": "What about in London?",
  "previous_interaction_id": "previous-interaction-id",
  "tools": [...]
}
```

Note: `tools`, `system_instruction`, and `generation_config` must be re-specified in each turn.

## Background Tasks (Agents)

Required for `agent`-typed requests (e.g., Deep Research):

```json
{
  "agent": "deep-research-preview-04-2026",
  "input": "History of Google TPUs focusing on 2025-2026",
  "background": true
}
```

The `raw` command will return immediately with `status: "in_progress"` and an `id`. Poll with:

```bash
curl -H "x-goog-api-key: $GEMINI_API_KEY" -H "Api-Revision: 2026-05-20" \
  "https://generativelanguage.googleapis.com/v1beta/interactions/<id>"
```

Or just use the dedicated `npx tiny-gemini research` command which polls for you.

## Known Limitations

- Tool combinations (MCP + Function Call + Built-in) not supported simultaneously
- Gemini 3 lacks remote MCP support (only `gemini-2.5-flash` had it, and that model shuts down 2026-10-16)
- Image size values must use uppercase K (e.g., "2K" not "2k")
- Streaming via the CLI's `--stream` only emits text deltas — for image / audio / function-call deltas, use `raw` with `"stream": true` and parse the SSE yourself
- The legacy response schema (`outputs[]`) and legacy SSE event names (`content.delta` etc.) are removed by Google on 2026-06-08 — always build to the post-2026-05 shapes shown here
