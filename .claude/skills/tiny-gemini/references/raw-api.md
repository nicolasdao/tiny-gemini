# Raw API and Advanced Patterns

The `raw` command sends any JSON body directly to the Gemini Interactions API. This is the escape hatch for features not covered by dedicated commands.

## Basic Usage

```bash
# Inline JSON
npx tiny-gemini raw '{"model":"gemini-3-flash-preview","input":"hello"}'

# From file
npx tiny-gemini raw --file request.json

# From stdin
echo '{"model":"...","input":"..."}' | npx tiny-gemini raw
```

The JSON body is sent unmodified to `POST /v1beta/interactions`. Response is printed as formatted JSON.

## Request Body Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `model` | string | One of model/agent | Model ID (e.g., `gemini-3-flash-preview`) |
| `agent` | string | One of model/agent | Agent ID (e.g., `deep-research-pro-preview-12-2025`) |
| `input` | string or Content[] | Yes | Text or multimodal content |
| `response_modalities` | string[] | No | Output types: `["IMAGE"]`, `["AUDIO"]`, `["TEXT", "IMAGE"]` |
| `generation_config` | object | No | Temperature, thinking, image config, speech config |
| `system_instruction` | string | No | System prompt |
| `response_format` | object | No | JSON schema for structured output |
| `tools` | Tool[] | No | Function calling, search, code execution |
| `previous_interaction_id` | string | No | For multi-turn conversations |
| `stream` | boolean | No | Enable streaming (default: false) |
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
| `mcp_server` | MCP server integration |

## Generation Config

```json
{
  "generation_config": {
    "temperature": 0.7,
    "max_output_tokens": 500,
    "thinking_level": "low",
    "image_config": { "aspect_ratio": "16:9", "image_size": "2K" },
    "speech_config": { "language": "en-us", "voice": "kore" }
  }
}
```

Thinking levels: `minimal`, `low`, `medium`, `high` (default).

## Multi-Speaker TTS

```json
{
  "model": "gemini-2.5-flash-preview-tts",
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

## Structured Output

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

## Response Output Types

| Type | Fields |
|------|--------|
| `text` | `text` |
| `image` | `data` (base64-png), `mime_type` |
| `audio` | `data` (base64-pcm), `mime_type` |
| `function_call` | `id`, `name`, `arguments` |
| `thought` | `summary` |

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

## Known Limitations

- Tool combinations (MCP + Function Call + Built-in) not supported simultaneously
- Gemini 3 lacks remote MCP support
- Image size values must use uppercase K (e.g., "2K" not "2k")
