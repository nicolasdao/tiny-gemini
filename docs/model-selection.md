# Model Selection Guide

Which Gemini model should you use? This document gives you one unambiguous answer for every use case. Snapshot is May 2026 (per 1M tokens unless noted). For the live registry, run `npx tiny-gemini models`.

## Decision Rules

Follow these rules in order. The FIRST match is your answer.

1. **Generating images and need professional quality or accurate text rendering?** Use `gemini-3-pro-image`.
2. **Generating images?** Use `gemini-3.1-flash-image`.
3. **Generating images at the lowest possible cost (1K resolution acceptable)?** Use `gemini-2.5-flash-image`.
4. **Generating speech from text?** Use `gemini-3.1-flash-tts-preview`.
5. **Native speech-in / speech-out conversation (not TTS)?** Use `gemini-2.5-flash-native-audio-preview-12-2025`.
6. **Running deep research (multi-minute autonomous investigation)?** Use `deep-research-preview-04-2026` (speed-optimized) or `deep-research-max-preview-04-2026` (comprehensive). These are agents, not models — set the request `agent` field, not `model`, and require `background: true`.
7. **Generating multimodal embeddings?** Use `gemini-embedding-2`.
8. **Need Remote MCP tool integration?** Use `gemini-2.5-flash` (Gemini 3 models do not support Remote MCP yet, and `gemini-2.5-flash` is being shut down on 2026-10-16 — plan accordingly).
9. **Need maximum reasoning quality regardless of cost?** Use `gemini-3.1-pro-preview`.
10. **Need the cheapest possible text generation?** Use `gemini-3.1-flash-lite`.
11. **Everything else (text, multimodal understanding, function calling, structured output, streaming)?** Use `gemini-3-flash-preview`.

## All Models

| Model ID | Type | Status | Use Case | Cost (per 1M tokens) | Free Tier |
|----------|------|--------|----------|----------------------|-----------|
| `gemini-3.5-flash` | Text | GA | Most intelligent flash-tier model (agentic/coding). Official replacement for `gemini-2.5-flash` | In: $1.50 / Out: $9.00 | Yes |
| `gemini-3-flash-preview` | Text | Preview | Default for all text tasks (best value) | In: $0.50 / Out: $3.00 | Yes |
| `gemini-3.1-pro-preview` | Text | Preview | Hardest reasoning problems | In: $2/$4 (≤200k/>200k) / Out: $12/$18. Cache reads $0.20, cache storage $4.50/hour | No |
| `gemini-3.1-flash-lite` | Text | GA | Cheapest text generation in the Gemini 3 family | In: $0.25 / Out: $1.50 | Yes |
| `gemini-2.5-flash` | Text | **Deprecated** (shutdown 2026-10-16, → `gemini-3.5-flash`) | Currently the only path to Remote MCP | In: $0.30 / Out: $2.50 | Yes |
| `gemini-2.5-pro` | Text | **Deprecated** (shutdown 2026-10-16, → `gemini-3.1-pro-preview`) | — | In: $1.25/$2.50 / Out: $10/$15 | Yes |
| `gemini-2.5-flash-lite` | Text | **Deprecated** (shutdown 2026-10-16, → `gemini-3.1-flash-lite`) | — | In: $0.10 / Out: $0.40 | Yes |
| `gemini-3.1-flash-image` | Image | GA | Default for image generation. Up to 4K, up to 14 reference images, 14 aspect ratios | In: $0.50 / Out: $60 (images), $3 (text) | No |
| `gemini-3-pro-image` | Image | GA | Professional assets, complex instructions, best in-image text | In: $2.00 / Out: $120 (images), $12 (text) | No |
| `gemini-2.5-flash-image` | Image | **Deprecated** (shutdown 2026-10-02, → `gemini-3.1-flash-image`) | Cheapest image generation. 1K only | In: $0.30 / Out: ~$0.039/image | Yes |
| `gemini-3.1-flash-tts-preview` | Audio | Preview | Default for text-to-speech | In: $1.00 / Out: $20.00 | No |
| `gemini-2.5-flash-preview-tts` | Audio | Preview | Lower-cost 2.5-family TTS (older than the default) | In: $0.50 / Out: $10 | Yes |
| `gemini-2.5-flash-native-audio-preview-12-2025` | Audio | Preview | Native speech-in / speech-out (distinct from TTS) | In: $0.50 text / $3 audio. Out: $2 text / $12 audio | No |
| `gemini-embedding-2` | Embeddings | GA | Multimodal embeddings (text, image, video, audio, PDF) | $0.20 in / — out | Yes |
| `deep-research-preview-04-2026` | Agent | Preview | Autonomous deep research (speed-optimized) | Billed via underlying model | No |
| `deep-research-max-preview-04-2026` | Agent | Preview | Autonomous deep research (comprehensive variant) | Billed via underlying model | No |

## Image Model Comparison

Use this when choosing between the three image models.

| Capability | `gemini-2.5-flash-image` | `gemini-3.1-flash-image` | `gemini-3-pro-image` |
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

**Rule of thumb:** Start with `gemini-3.1-flash-image`. Move to `gemini-3-pro-image` only if you need the best text rendering or the highest fidelity for professional assets. Move to `gemini-2.5-flash-image` only if cost is the primary constraint and 1K resolution is acceptable.

## Text Model Comparison

Use this when choosing between text models. The Gemini 2.5 family is in the table for context — they are deprecated and will shut down on 2026-10-16.

| Capability | `gemini-3.1-flash-lite` | `gemini-3-flash-preview` | `gemini-3.1-pro-preview` |
|------------|:-----------------------:|:------------------------:|:------------------------:|
| Output cost (per 1M tokens) | $1.50 | $3.00 | $12–18 |
| Reasoning quality | Good | Very good | Best |
| Thinking level control | No | Yes (minimal→high) | Yes |
| Multimodal input | Yes | Yes | Yes |
| Function calling | Yes | Yes | Yes |
| Structured output | Yes | Yes | Yes |
| Streaming | Yes | Yes | Yes |
| Remote MCP | No | No (coming soon) | No |
| API stability | Stable (GA) | Preview | Preview |
| Free tier | Yes | Yes | No |

**Rule of thumb:** Start with `gemini-3-flash-preview`. It handles the vast majority of text tasks well. Move to `gemini-3.1-pro-preview` for problems that require deeper reasoning. Move to `gemini-3.1-flash-lite` when cost matters more than quality.

## CLI Defaults

The `tiny-gemini` CLI uses these defaults (overridable with `--model`):

| Command | Default Model |
|---------|---------------|
| `prompt` | `gemini-3-flash-preview` |
| `image` (generate, edit, story, icon, pattern, diagram) | `gemini-3.1-flash-image` |
| `image describe` | `gemini-3-flash-preview` |
| `tts` | `gemini-3.1-flash-tts-preview` |
| `search` | `gemini-3-flash-preview` |
| `research` | `deep-research-preview-04-2026` |

To override: `tiny-gemini image "a cat" --model=gemini-3-pro-image`

If you pass `--model` resolving to `gemini-2.5-pro`, `gemini-2.5-flash`, or `gemini-2.5-flash-lite`, the CLI prints a deprecation warning to stderr and proceeds. After 2026-10-16 it fails fast with a link to the deprecation page.

## Live Discovery

Prefer the CLI over reading this doc — the embedded registry stays in sync with releases:

```bash
tiny-gemini models                       # all models
tiny-gemini models list --type=image     # filter
tiny-gemini models list --status=deprecated
tiny-gemini models pricing
tiny-gemini models list --json           # for scripting
```
