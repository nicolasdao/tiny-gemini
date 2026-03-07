# Model Selection Guide

Which Gemini model should you use? This document gives you one unambiguous answer for every use case. Pricing is from March 2026 (per 1M tokens unless noted).

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

| Model ID | Type | Use Case | Capabilities | Cost (Paid Tier) | Free Tier |
|----------|------|----------|--------------|------------------|-----------|
| `gemini-3-flash-preview` | Text | Default for all text tasks | Text gen, multimodal understanding (image/audio/video input), function calling, structured output (JSON schema), streaming, Google Search grounding, thinking levels (minimal to high) | In: $0.50 / Out: $3.00 | Yes |
| `gemini-3.1-pro-preview` | Text | Hardest reasoning problems | Most capable model, deepest reasoning, largest context | In: $2–4 / Out: $12–18 | No |
| `gemini-2.5-flash` | Text | Remote MCP, stable workloads | Text gen, multimodal understanding, Remote MCP support, streaming | In: $0.30 / Out: $2.50 | Yes |
| `gemini-2.5-pro` | Text | Stable production (non-preview) | Strong reasoning, stable API, multimodal understanding | In: $1.25–2.50 / Out: $10–15 | Yes |
| `gemini-2.5-flash-lite` | Text | High-volume simple tasks | Lightweight text gen, cheapest option | In: $0.10 / Out: $0.40 | Yes |
| `gemini-3.1-flash-image-preview` | Image | Default for all image generation | Text-to-image, image editing, 512px/1K/2K/4K output, up to 14 reference images (10 objects + 4 characters), Google Web + Image Search grounding, thinking mode, all 14 aspect ratios | In: $0.50 / Out: $60 (images), $3 (text) | No |
| `gemini-3-pro-image-preview` | Image | Professional assets, complex instructions | Text-to-image, image editing, 1K/2K/4K output, up to 14 reference images (6 objects + 5 characters), Google Web Search grounding, thinking mode, best text rendering in images, 10 aspect ratios | In: $2.00 / Out: $120 (images), $12 (text) | No |
| `gemini-2.5-flash-image` | Image | Cheapest image generation | Text-to-image, image editing, 1K output only, up to 3 input images, 10 aspect ratios | In: $0.30 / Out: ~$0.039/image | Yes |
| `gemini-2.5-flash-preview-tts` | Audio | Text-to-speech | Text to WAV audio, multi-speaker, multiple languages | In: $0.50 / Out: $10 (audio) | Yes |
| `deep-research-pro-preview-12-2025` | Agent | Autonomous deep research | Multi-minute research reports, requires `background: true`, uses `agent` field (not `model`) | Pro-tier pricing | No |
| `gemini-2.5-computer-use-preview-10-2025` | Specialized | UI automation | Screen interaction, computer control | In: $1.25–2.50 / Out: $10–15 | No |

## Image Model Comparison

Use this when choosing between the three image models.

| Capability | `gemini-2.5-flash-image` | `gemini-3.1-flash-image-preview` | `gemini-3-pro-image-preview` |
|------------|:------------------------:|:--------------------------------:|:----------------------------:|
| Cost per image | ~$0.04 | ~$0.07 | ~$0.13 |
| Max resolution | 1K | 4K | 4K |
| 512px (small/fast) | No | Yes | No |
| Max reference images | 3 | 14 | 14 |
| Web Search grounding | No | Yes | Yes |
| Image Search grounding | No | Yes | No |
| Thinking mode | No | Yes | Yes |
| Text rendering quality | Basic | Good | Best |
| Aspect ratios | 10 | 14 (adds 1:4, 4:1, 1:8, 8:1) | 10 |
| Free tier | Yes | No | No |

**Rule of thumb:** Start with `gemini-3.1-flash-image-preview`. Move to `gemini-3-pro-image-preview` only if you need the best text rendering or the highest fidelity for professional assets. Move to `gemini-2.5-flash-image` only if cost is the primary constraint and 1K resolution is acceptable.

## Text Model Comparison

Use this when choosing between text models.

| Capability | `gemini-2.5-flash-lite` | `gemini-2.5-flash` | `gemini-3-flash-preview` | `gemini-2.5-pro` | `gemini-3.1-pro-preview` |
|------------|:-----------------------:|:-------------------:|:------------------------:|:-----------------:|:------------------------:|
| Output cost (per 1M tokens) | $0.40 | $2.50 | $3.00 | $10–15 | $12–18 |
| Reasoning quality | Basic | Good | Very good | Strong | Best |
| Thinking level control | No | No | Yes (minimal→high) | No | No |
| Multimodal input | Yes | Yes | Yes | Yes | Yes |
| Function calling | Yes | Yes | Yes | Yes | Yes |
| Structured output | Yes | Yes | Yes | Yes | Yes |
| Streaming | Yes | Yes | Yes | Yes | Yes |
| Remote MCP | No | Yes | No (coming soon) | No | No |
| API stability | Stable | Stable | Preview | Stable | Preview |
| Free tier | Yes | Yes | Yes | Yes | No |

**Rule of thumb:** Start with `gemini-3-flash-preview`. It handles the vast majority of text tasks well. Move to `gemini-3.1-pro-preview` for problems that require deeper reasoning. Move to `gemini-2.5-flash-lite` when cost matters more than quality.

## CLI Defaults

The `tiny-gemini` CLI uses these defaults (overridable with `--model`):

| Command | Default Model |
|---------|---------------|
| `prompt` | `gemini-3-flash-preview` |
| `image` (generate, edit, story, icon, pattern, diagram) | `gemini-3.1-flash-image-preview` |
| `image describe` | `gemini-3-flash-preview` |
| `tts` | `gemini-2.5-flash-preview-tts` |
| `search` | `gemini-3-flash-preview` |
| `research` | `deep-research-pro-preview-12-2025` |

To override: `tiny-gemini image "a cat" --model=gemini-3.1-flash-image-preview`
