---
name: tiny-gemini-models
description: tiny-gemini — Look up Gemini model IDs, pricing, and deprecations from the offline registry in the npx CLI. Use when asking which models exist, what they cost, what is deprecated, or which model to choose. Not for calling a model.
user-invocable: false
allowed-tools: Bash, Read
---

# tiny-gemini-models — Offline Gemini model registry

Use the `npx tiny-gemini models` command to **discover** Google Gemini models, pricing, capabilities, and deprecation status — without making any API call. Backed by an embedded snapshot of [ai.google.dev/gemini-api/docs/models](https://ai.google.dev/gemini-api/docs/models) plus the pricing and deprecations pages, refreshed each CLI release. Part of the [tiny-gemini](../tiny-gemini/SKILL.md) suite.

## Scope

This skill owns every "ask about the Gemini API" verb (vs "use" the API):

| User intent | Command |
|-------------|---------|
| "what Gemini models exist?" | `models list` |
| "list image / audio / text / embedding / agent models" | `models list --type=<type>` |
| "show only GA / preview / deprecated models" | `models list --status=<status>` |
| "how much does Gemini Pro cost?" | `models pricing` |
| "give me the model registry as JSON" | `models list --json` |
| "which Gemini model should I use for X?" | Use the decision rules below |

### What NOT to handle here

| Sibling intent | Where it lives |
|----------------|----------------|
| **Actually calling a model** (text gen, image gen, TTS, research) | Core `tiny-gemini`, `tiny-gemini-image`, `tiny-gemini-tts`, `tiny-gemini-research` |
| Sending a raw request body | Core `tiny-gemini` `raw` command |

This skill is **offline** — no API key needed, no network call. It's pure reference / discovery.

## Quick Reference

```bash
# Full table
npx tiny-gemini models                       # alias for `models list`
npx tiny-gemini models list

# Filters (combinable, work on both `list` and `pricing`)
npx tiny-gemini models list --type=text
npx tiny-gemini models list --type=image
npx tiny-gemini models list --type=audio
npx tiny-gemini models list --type=embeddings
npx tiny-gemini models list --type=agent
npx tiny-gemini models list --status=ga
npx tiny-gemini models list --status=preview
npx tiny-gemini models list --status=deprecated

# Pricing-only view
npx tiny-gemini models pricing

# Machine-readable
npx tiny-gemini models list --json
```

## Output Shape (--json)

Each entry is an object with:

```json
{
  "id": "gemini-3-flash-preview",
  "type": "text",
  "status": "preview",
  "context_window": 1048576,
  "capabilities": ["text", "vision", "function_calling", "structured_output", "streaming", "google_search", "thinking"],
  "pricing": {
    "input_per_1m": 0.50,
    "output_per_1m": 3.00,
    "currency": "USD",
    "notes": null
  },
  "deprecated_on": null,
  "shutdown_on": null,
  "replacement": null,
  "free_tier": true
}
```

Tiered models (e.g., `gemini-3.1-pro-preview`) include `input_per_1m_over_200k` / `output_per_1m_over_200k`. Cache-pricing models include `cache_read_per_1m` and `cache_storage_per_1m_per_hour`. Deprecated models populate `deprecated_on`, `shutdown_on`, and `replacement`.

## Decision Rules — Which Model to Use

Apply in order. The FIRST match is your answer.

1. **Generating images and need professional quality / accurate text rendering?** → `gemini-3-pro-image-preview`
2. **Generating images?** → `gemini-3.1-flash-image-preview`
3. **Generating images at the lowest possible cost, 1K acceptable?** → `gemini-2.5-flash-image`
4. **Generating speech from text?** → `gemini-3.1-flash-tts-preview`
5. **Native speech-in / speech-out (not TTS)?** → `gemini-2.5-flash-native-audio-preview-12-2025`
6. **Multi-minute autonomous research?** → `deep-research-preview-04-2026` (or `-max-` for comprehensive)
7. **Multimodal embeddings?** → `gemini-embedding-2`
8. **Need Remote MCP integration?** → `gemini-2.5-flash` (Gemini 3 doesn't support it; this model shuts down 2026-10-16)
9. **Maximum reasoning quality regardless of cost?** → `gemini-3.1-pro-preview`
10. **Cheapest text generation?** → `gemini-3.1-flash-lite`
11. **Everything else (text, multimodal understanding, function calling, structured output, streaming)?** → `gemini-3-flash-preview`

## Sunset Calendar (2026-10-16)

| Sunset model | Replacement |
|-------------|-------------|
| `gemini-2.5-pro` | `gemini-3.1-pro-preview` |
| `gemini-2.5-flash` | `gemini-3-flash-preview` |
| `gemini-2.5-flash-lite` | `gemini-3.1-flash-lite` |

Passing any of these via `--model` to a calling command triggers a stderr deprecation warning until shutdown; after 2026-10-16 the call fails fast. The 2.5 TTS model (`gemini-2.5-flash-preview-tts`) is also deprecated but Google has not yet announced its shutdown date.

## Updating the Registry

The registry snapshot ships with the CLI as `models.json`. To refresh, update the `tiny-gemini` npm package itself (`npm update -g tiny-gemini` or just use `npx tiny-gemini@latest`). The skill version isn't tied to model registry refreshes — that's controlled by the CLI's release cadence.

## Constraints

- ALWAYS use `npx tiny-gemini models` (no API key needed, no network call)
- NEVER fabricate model IDs not present in the registry — run the command first to verify
- The registry is a **snapshot** — for breaking changes between snapshots, check https://ai.google.dev/gemini-api/docs/changelog
- For the live registry from Google's API (vs the embedded snapshot), call `GET https://generativelanguage.googleapis.com/v1beta/models` directly with curl — pricing isn't included in the API response, only the embedded snapshot has that
- Recommend a model BEFORE the user runs a command — the cheapest path is to check `models list --type=<X>` first, then pick the right `--model` for the calling command
