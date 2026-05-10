# Model Selection Guide

Snapshot: May 2026. For the live registry, run `npx tiny-gemini models`.

## Decision Rules

Follow these rules in order. The FIRST match is your answer.

1. **Generating images and need professional quality or accurate text rendering?** Use `gemini-3-pro-image-preview`.
2. **Generating images?** Use `gemini-3.1-flash-image-preview`.
3. **Generating images at the lowest possible cost (1K resolution acceptable)?** Use `gemini-2.5-flash-image`.
4. **Generating speech from text?** Use `gemini-3.1-flash-tts-preview`.
5. **Native speech-in / speech-out conversation (not TTS)?** Use `gemini-2.5-flash-native-audio-preview-12-2025`.
6. **Running deep research (multi-minute autonomous investigation)?** Use `deep-research-preview-04-2026` (speed-optimized) or `deep-research-max-preview-04-2026` (comprehensive). Agents, not models — set the request `agent` field, not `model`.
7. **Generating multimodal embeddings?** Use `gemini-embedding-2`.
8. **Need Remote MCP tool integration?** Use `gemini-2.5-flash` (Gemini 3 models do not support Remote MCP yet). Note: `gemini-2.5-flash` will be shut down on 2026-10-16.
9. **Need maximum reasoning quality regardless of cost?** Use `gemini-3.1-pro-preview`.
10. **Need the cheapest possible text generation?** Use `gemini-3.1-flash-lite`.
11. **Everything else (text, multimodal understanding, function calling, structured output, streaming)?** Use `gemini-3-flash-preview`.

## All Models

| Model ID | Type | Use Case |
|----------|------|----------|
| `gemini-3-flash-preview` | Text | Default for all text tasks. Text gen, multimodal understanding, function calling, structured output, streaming, Google Search grounding, thinking levels. |
| `gemini-3.1-pro-preview` | Text | Hardest reasoning problems. Most capable model, deepest reasoning, largest context. |
| `gemini-3.1-flash-lite` | Text (GA) | Cheapest text in the Gemini 3 family. |
| `gemini-2.5-flash` | Text — **Sunset 2026-10-16** | Currently the only path to Remote MCP. Replacement: `gemini-3-flash-preview`. |
| `gemini-2.5-pro` | Text — **Sunset 2026-10-16** | Replacement: `gemini-3.1-pro-preview`. |
| `gemini-2.5-flash-lite` | Text — **Sunset 2026-10-16** | Replacement: `gemini-3.1-flash-lite`. |
| `gemini-3.1-flash-image-preview` | Image | Default for image generation. Up to 4K, up to 14 reference images, all 14 aspect ratios. |
| `gemini-3-pro-image-preview` | Image | Professional assets. Highest quality, best text rendering in images. |
| `gemini-2.5-flash-image` | Image (GA) | Cheapest image generation. 1K only, up to 3 input images. |
| `gemini-3.1-flash-tts-preview` | Audio | TTS default. Outputs raw PCM converted to WAV. |
| `gemini-2.5-flash-preview-tts` | Audio — **Deprecated** | Replacement: `gemini-3.1-flash-tts-preview`. |
| `gemini-2.5-flash-native-audio-preview-12-2025` | Audio | Native speech-in / speech-out (distinct from TTS). |
| `gemini-embedding-2` | Embeddings (GA) | Multimodal: text, image, video, audio, PDF. |
| `deep-research-preview-04-2026` | Agent | Autonomous deep research (speed-optimized). Requires `background: true`, uses `agent` field (not `model`). |
| `deep-research-max-preview-04-2026` | Agent | Autonomous deep research (comprehensive variant). Requires `background: true`. |

## CLI Defaults

| Command | Default Model |
|---------|---------------|
| `prompt` | `gemini-3-flash-preview` |
| `image` (generate, edit, story, icon, pattern, diagram) | `gemini-3.1-flash-image-preview` |
| `image describe` | `gemini-3-flash-preview` |
| `tts` | `gemini-3.1-flash-tts-preview` |
| `search` | `gemini-3-flash-preview` |
| `research` | `deep-research-preview-04-2026` |

Override: `npx tiny-gemini image "a cat" --model=gemini-3-pro-image-preview`

## Live Discovery

Prefer the CLI over reading this file:

```bash
npx tiny-gemini models                       # all models
npx tiny-gemini models list --type=image     # filter by type
npx tiny-gemini models list --status=deprecated
npx tiny-gemini models pricing
npx tiny-gemini models list --json           # for scripting
```

## Image Model Comparison

| Capability | `gemini-2.5-flash-image` | `gemini-3.1-flash-image-preview` | `gemini-3-pro-image-preview` |
|------------|:------------------------:|:--------------------------------:|:----------------------------:|
| Max resolution | 1K | 4K | 4K |
| 512px (small/fast) | No | Yes | No |
| Max reference images | 3 | 14 | 14 |
| Text rendering quality | Basic | Good | Best |
| Free tier | Yes | No | No |

## Sunset Calendar

The Gemini 2.5 text family shuts down **2026-10-16**:

| Model | Replacement |
|-------|-------------|
| `gemini-2.5-pro` | `gemini-3.1-pro-preview` |
| `gemini-2.5-flash` | `gemini-3-flash-preview` |
| `gemini-2.5-flash-lite` | `gemini-3.1-flash-lite` |

Passing any of those via `--model` triggers a stderr deprecation warning until shutdown; after the shutdown date the CLI fails fast with a link to https://ai.google.dev/gemini-api/docs/deprecations.
