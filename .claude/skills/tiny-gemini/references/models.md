# Model Selection Guide

## Decision Rules

Follow these rules in order. The FIRST match is your answer.

1. **Generating images and need professional quality or accurate text rendering?** Use `gemini-3-pro-image-preview`.
2. **Generating images?** Use `gemini-3.1-flash-image-preview`.
3. **Generating images at the lowest possible cost (1K resolution acceptable)?** Use `gemini-2.5-flash-image`.
4. **Generating speech from text?** Use `gemini-2.5-flash-preview-tts`.
5. **Running deep research (multi-minute autonomous investigation)?** Use `deep-research-pro-preview-12-2025` (agent, not model).
6. **Need Remote MCP tool integration?** Use `gemini-2.5-flash` (Gemini 3 models do not support Remote MCP yet).
7. **Need maximum reasoning quality regardless of cost?** Use `gemini-3.1-pro-preview`.
8. **Need the cheapest possible text generation?** Use `gemini-2.5-flash-lite`.
9. **Everything else (text, multimodal understanding, function calling, structured output, streaming)?** Use `gemini-3-flash-preview`.

## All Models

| Model ID | Type | Use Case |
|----------|------|----------|
| `gemini-3-flash-preview` | Text | Default for all text tasks. Text gen, multimodal understanding, function calling, structured output, streaming, Google Search grounding, thinking levels. |
| `gemini-3.1-pro-preview` | Text | Hardest reasoning problems. Most capable model, deepest reasoning, largest context. |
| `gemini-2.5-flash` | Text | Remote MCP support, stable workloads. |
| `gemini-2.5-pro` | Text | Stable production (non-preview). Strong reasoning. |
| `gemini-2.5-flash-lite` | Text | High-volume simple tasks. Cheapest option. |
| `gemini-3.1-flash-image-preview` | Image | Default for image generation. Up to 4K, up to 14 reference images, all 14 aspect ratios. |
| `gemini-3-pro-image-preview` | Image | Professional assets. Highest quality, best text rendering in images. |
| `gemini-2.5-flash-image` | Image | Cheapest image generation. 1K only, up to 3 input images. |
| `gemini-2.5-flash-preview-tts` | Audio | Text-to-speech. Outputs raw PCM converted to WAV. |
| `deep-research-pro-preview-12-2025` | Agent | Autonomous deep research. Requires `background: true`, uses `agent` field (not `model`). |

## CLI Defaults

| Command | Default Model |
|---------|---------------|
| `prompt` | `gemini-3-flash-preview` |
| `image` (generate, edit, story, icon, pattern, diagram) | `gemini-3.1-flash-image-preview` |
| `image describe` | `gemini-3-flash-preview` |
| `tts` | `gemini-2.5-flash-preview-tts` |
| `search` | `gemini-3-flash-preview` |
| `research` | `deep-research-pro-preview-12-2025` |

Override: `npx tiny-gemini image "a cat" --model=gemini-3-pro-image-preview`

## Image Model Comparison

| Capability | `gemini-2.5-flash-image` | `gemini-3.1-flash-image-preview` | `gemini-3-pro-image-preview` |
|------------|:------------------------:|:--------------------------------:|:----------------------------:|
| Max resolution | 1K | 4K | 4K |
| 512px (small/fast) | No | Yes | No |
| Max reference images | 3 | 14 | 14 |
| Text rendering quality | Basic | Good | Best |
| Free tier | Yes | No | No |
