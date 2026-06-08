---
name: tiny-gemini-tts
description: tiny-gemini — Generate speech audio from text via the Gemini TTS model in the npx CLI. Use when converting text to speech, building multi-speaker dialogue, or producing WAV narration. Not for text generation, images, or research.
allowed-tools: Bash, Read
---

# tiny-gemini-tts — Text-to-speech

Use the `npx tiny-gemini tts` command to synthesize speech audio from text via the Google Gemini TTS model. Part of the [tiny-gemini](../tiny-gemini/SKILL.md) suite.

## Scope

This skill owns every speech-synthesis verb in the tiny-gemini CLI:

| User intent | Command |
|-------------|---------|
| "convert this to speech / read aloud / speak this" | `tts "<text>"` |
| "generate a WAV file from this text" | `tts "<text>"` |
| "narrate / voice over" | `tts "<text>" --voice=<name>` |
| "in French / Spanish / etc." | `tts "<text>" --language=<code>` |

### What NOT to handle here

| Sibling intent | Where it lives |
|----------------|----------------|
| Text Q&A, summarization, search-grounded text | Core `tiny-gemini` skill |
| Image generation, editing, understanding | `tiny-gemini-image` |
| Multi-minute autonomous research | `tiny-gemini-research` |
| Looking up which models exist or what they cost | `tiny-gemini-models` |
| Multi-speaker dialogue requiring custom JSON | Core `tiny-gemini` `raw` command (see core for the multi-speaker `speech_config` shape) |

## Default Model

`gemini-3.1-flash-tts-preview` (April 2026 launch, the recommended TTS model). The older `gemini-2.5-flash-preview-tts` is still active (Preview) and selectable via `--model`. `speech_config` is sent as an array even for a single speaker.

## Quick Reference

```bash
# Basic usage — saves WAV to ./tiny-gemini-output/
npx tiny-gemini tts "Hello, how are you today?"

# Voice + language overrides
npx tiny-gemini tts "Bonjour le monde" --voice=Kore --language=fr-fr

# Auto-open after saving
npx tiny-gemini tts "Welcome" --preview
```

## Options

| Flag | Default | Description |
|------|---------|-------------|
| `--voice` | `Kore` | Voice name, title-case (also: `Zephyr`, `Puck`, etc.). The CLI capitalizes the first letter. |
| `--language` | `en-us` | BCP-47 language code (`fr-fr`, `es-es`, `ja-jp`, ...) |
| `--model` | `gemini-3.1-flash-tts-preview` | Model override |
| `--output-dir` | `./tiny-gemini-output` | Where to save the WAV |
| `--preview` | — | Auto-open the file after saving |

## Output

The Gemini TTS model returns raw 24kHz 16-bit mono PCM. The CLI wraps it in a 44-byte WAV header before saving — the file is immediately playable. Filename pattern: `tts_<sanitized-text-snippet>.wav` in `--output-dir`.

## Multi-Speaker Dialogue

Multi-speaker TTS isn't a dedicated CLI flag — use the core `tiny-gemini raw` command with a JSON body containing `speech_config` as an array. Example shape:

```json
{
  "model": "gemini-3.1-flash-tts-preview",
  "input": "Alice: Hello! Bob: Hi there!",
  "response_modalities": ["audio"],
  "generation_config": {
    "speech_config": [
      { "voice": "Zephyr", "speaker": "Alice", "language": "en-US" },
      { "voice": "Puck",   "speaker": "Bob",   "language": "en-US" }
    ]
  }
}
```

Pipe to `npx tiny-gemini raw`. See core's `references/raw-api.md` for the full shape.

## Pricing

`gemini-3.1-flash-tts-preview`: $1.00 input / $20.00 output per 1M tokens (preview, **no free tier**). The older `gemini-2.5-flash-preview-tts` ($0.50 / $10.00, still active Preview, free tier) is selectable via `--model`. The CLI emits no deprecation warning for either (only the 2026-10-16 sunset 2.5 *text* models warn).

Run `npx tiny-gemini models list --type=audio` for the live registry.

## API Key & Cross-Cutting Setup

TTS commands need a Google Gemini API key. Setup is shared with the rest of the suite — see the core [tiny-gemini](../tiny-gemini/SKILL.md) skill for:

- API key resolution order
- Env var overrides
- Agentic workflow flags

## Constraints

- ALWAYS use `npx tiny-gemini` (not a global install)
- NEVER fabricate flags not documented above
- TTS is preview-tier and **not free** — confirm with the user before generating large batches
- Output is always WAV (PCM-wrapped). For other audio formats, transcode externally
- For native speech-in / speech-out (live dialogue), use core's `raw` command with `gemini-2.5-flash-native-audio-preview-12-2025` — that's a different model and beyond the basic `tts` command
