# Model Selection Guide

Snapshot: June 2026. For the live registry, run `npx tiny-gemini models`.

## Decision Rules

Follow these rules in order. The FIRST match is your answer.

1. **Generating images and need professional quality or accurate text rendering?** Use `gemini-3-pro-image`.
2. **Generating images?** Use `gemini-3.1-flash-image`.
3. **Generating images at the lowest possible cost/latency (1K resolution acceptable)?** Use `gemini-3.1-flash-lite-image` (GA "Nano Banana 2 Lite"; the deprecated `gemini-2.5-flash-image` still serves until shutdown 2026-10-02).
4. **Generating speech from text?** Use `gemini-3.1-flash-tts-preview`.
5. **Native speech-in / speech-out conversation (not TTS)?** Use `gemini-2.5-flash-native-audio-preview-12-2025`.
6. **Generating or editing video (short 720p clips from text or an image)?** Use `gemini-omni-flash-preview` (Omni Flash) — the CLI's `video` command default.
7. **Running deep research (multi-minute autonomous investigation)?** Use `deep-research-preview-04-2026` (speed-optimized) or `deep-research-max-preview-04-2026` (comprehensive). Agents, not models — set the request `agent` field, not `model`.
8. **Generating multimodal embeddings?** Use `gemini-embedding-2`.
9. **Need Remote MCP tool integration?** Use `gemini-2.5-flash` (Gemini 3 models do not support Remote MCP yet). Note: `gemini-2.5-flash` will be shut down on 2026-10-16.
10. **Need maximum reasoning quality regardless of cost?** Use `gemini-3.1-pro-preview`.
11. **Need the cheapest possible text generation?** Use `gemini-3.1-flash-lite`.
12. **Need a GA (non-preview) flash model for agentic/coding, cost no object?** Use `gemini-3.5-flash` (GA, replaces `gemini-2.5-flash`).
13. **Everything else (text, multimodal understanding, function calling, structured output, streaming)?** Use `gemini-3-flash-preview` (best value, the CLI's text default).

## All Models

| Model ID | Type | Use Case |
|----------|------|----------|
| `gemini-3.5-flash` | Text (GA) | Most intelligent flash-tier model (agentic/coding). Official replacement for `gemini-2.5-flash`. $1.50/$9.00. |
| `gemini-3-flash-preview` | Text | Default for all text tasks (best value). Text gen, multimodal understanding, function calling, structured output, streaming, Google Search grounding, thinking levels. |
| `gemini-3.1-pro-preview` | Text | Hardest reasoning problems. Most capable model, deepest reasoning, largest context. |
| `gemini-3.1-flash-lite` | Text (GA) | Cheapest text in the Gemini 3 family. |
| `gemini-2.5-flash` | Text — **Sunset 2026-10-16** | Currently the only path to Remote MCP. Replacement: `gemini-3.5-flash`. |
| `gemini-2.5-pro` | Text — **Sunset 2026-10-16** | Replacement: `gemini-3.1-pro-preview`. |
| `gemini-2.5-flash-lite` | Text — **Sunset 2026-10-16** | Replacement: `gemini-3.1-flash-lite`. |
| `gemini-3.1-flash-image` | Image (GA) | Default for image generation. Up to 4K, up to 14 reference images, all 14 aspect ratios (only model with `512px` + extreme ratios). JPEG default; PNG via `mime_type`. |
| `gemini-3.1-flash-lite-image` | Image (GA) | Cheapest/fastest (GA 2026-06-30, "Nano Banana 2 Lite"). 1K only, 10 standard ratios. Successor to `gemini-2.5-flash-image`. |
| `gemini-3-pro-image` | Image (GA) | Professional assets. Highest quality, best text rendering in images. |
| `gemini-2.5-flash-image` | Image — **Sunset 2026-10-02** | Cheapest image generation. 1K only. Replacement: `gemini-3.1-flash-lite-image`. |
| `gemini-3.1-flash-tts-preview` | Audio | TTS default. Outputs raw PCM converted to WAV. |
| `gemini-2.5-flash-preview-tts` | Audio (Preview) | Older, lower-cost 2.5-family TTS. Still active (not deprecated). |
| `gemini-2.5-pro-preview-tts` | Audio (Preview) | Higher-tier 2.5-family TTS ($1.00/$20.00, no free tier). `gemini-3.1-flash-tts-preview` is the newer default. |
| `gemini-2.5-flash-native-audio-preview-12-2025` | Audio | Native speech-in / speech-out (distinct from TTS). |
| `gemini-omni-flash-preview` | Video (Preview) | Text/image → short 720p video (3–10s, 24fps) + conversational editing. CLI `video` default. ~$0.10/s of 720p output, no free tier. Codename: Omni Flash. |
| `gemini-embedding-2` | Embeddings (GA) | Multimodal: text, image, video, audio, PDF. |
| `deep-research-preview-04-2026` | Agent | Autonomous deep research (speed-optimized). Requires `background: true`, uses `agent` field (not `model`). |
| `deep-research-max-preview-04-2026` | Agent | Autonomous deep research (comprehensive variant). Requires `background: true`. |

## CLI Defaults

| Command | Default Model |
|---------|---------------|
| `prompt` | `gemini-3-flash-preview` |
| `image` (generate, edit, story, icon, pattern, diagram) | `gemini-3.1-flash-image` |
| `image describe` | `gemini-3-flash-preview` |
| `tts` | `gemini-3.1-flash-tts-preview` |
| `video` (generate, edit) | `gemini-omni-flash-preview` |
| `search` | `gemini-3-flash-preview` |
| `research` | `deep-research-preview-04-2026` |

Override: `npx tiny-gemini image "a cat" --model=gemini-3-pro-image`

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

| Capability | `gemini-2.5-flash-image` | `gemini-3.1-flash-image` | `gemini-3-pro-image` |
|------------|:------------------------:|:--------------------------------:|:----------------------------:|
| Max resolution | 1K | 4K | 4K |
| 512px (small/fast) | No | Yes | No |
| Max reference images | 3 | 14 | 14 |
| Text rendering quality | Basic | Good | Best |
| Free tier | Yes | No | No |

## Sunset Calendar

Shutdown dates differ per model:

| Model | Shutdown | Replacement |
|-------|----------|-------------|
| `gemini-3.1-flash-image-preview` | 2026-06-25 | `gemini-3.1-flash-image` (GA) |
| `gemini-3-pro-image-preview` | 2026-06-25 | `gemini-3-pro-image` (GA) |
| `gemini-2.5-flash-image` | 2026-10-02 | `gemini-3.1-flash-image` |
| `gemini-2.5-pro` | 2026-10-16 | `gemini-3.1-pro-preview` |
| `gemini-2.5-flash` | 2026-10-16 | `gemini-3.5-flash` |
| `gemini-2.5-flash-lite` | 2026-10-16 | `gemini-3.1-flash-lite` |

Passing any of those via `--model` triggers a stderr deprecation warning until that model's date; after it the CLI fails fast with a link to https://ai.google.dev/gemini-api/docs/deprecations.
