# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0] - 2026-05-10

### Changed (breaking)

- **Default TTS model** swapped from `gemini-2.5-flash-preview-tts` to `gemini-3.1-flash-tts-preview` (April 2026 launch, official replacement). Override with `--model` if you need to pin to the old model
- **Default research agent** swapped from `deep-research-pro-preview-12-2025` (gone) to `deep-research-preview-04-2026`. The unversioned `deep-research-preview` ID does not exist on Google's models page
- **Interactions API schema migration** — the CLI now sends `Api-Revision: 2026-05-20` to opt into Google's new response schema (`steps` array, renamed SSE events) ahead of the 2026-05-26 default flip and 2026-06-08 legacy removal. Image generation request bodies now place `aspect_ratio`/`image_size` under `response_format` with `"type": "image"` instead of `generation_config.image_config`. Structured output (`--schema`) now wraps the user schema in `response_format: { type: "text", mime_type: "application/json", schema: {...} }`. The `raw` command response shape now uses `steps` instead of `outputs` — downstream consumers parsing raw JSON should adapt
- `extractOutputs()` parses both `steps` (new) and `outputs` (legacy) defensively so the CLI keeps working if the header is rejected by an older proxy
- SSE parser accepts both `step.delta` (new) and `content.delta` (legacy) event names

### Added

- **`models` command** — discoverable model registry, no API call needed
  - `tiny-gemini models` / `tiny-gemini models list` — human-readable table
  - `tiny-gemini models pricing` — pricing-only table
  - `tiny-gemini models list --json` — machine-readable
  - `--type` filter (text|image|audio|embeddings|agent), `--status` filter (ga|preview|deprecated)
  - Backed by an embedded `models.json` snapshot of the official models/pricing/deprecations pages
- **Sunset warnings** — `--model gemini-2.5-pro|gemini-2.5-flash|gemini-2.5-flash-lite` prints a stderr warning naming the replacement and the 2026-10-16 shutdown date, then proceeds. After 2026-10-16 the CLI fails fast with a link to the deprecation page
- New models added to the registry: `gemini-3.1-flash-lite` (GA), `gemini-3.1-flash-tts-preview`, `gemini-2.5-flash-native-audio-preview-12-2025`, `gemini-embedding-2`, `deep-research-preview-04-2026`, `deep-research-max-preview-04-2026`

### Removed

- The TTS default no longer points at the deprecated `gemini-2.5-flash-preview-tts` (still selectable via `--model` until Google announces its shutdown)

## [1.2.0] - 2026-03-07

### Added

- Interactive API key setup for first-time users — when no key is configured in a TTY terminal, the CLI guides the user through getting a key and offers a masked input prompt to paste and save it to `~/.gemini/.env`
- TTY detection for the API key error flow — non-TTY environments (pipes, scripts, LLM agents) get a concise error with actionable setup commands instead of an interactive prompt
- Smart `.env` file handling — saves new keys without overwriting existing content, replaces existing `GEMINI_API_KEY` lines in-place, or appends to the file with proper newline handling

## [1.1.0] - 2026-03-07

### Added

- `--prompt-file` flag — inject text file contents into prompts without reading them into the caller's context (repeatable for multiple files)
- `--output-file` flag — write responses to disk instead of stdout, with only a short summary printed
- `--output-format` flag — force `plain` (text file) or `manifest` (JSON with file references) output mode
- Smart detection for manifest vs plain text output based on response content (function calls or text blocks > 4000 chars trigger manifest mode)
- Manifest output format with text previews, file references, byte/line counts, function calls, and media references

### Changed

- `--prompt-file`-only invocations now work without a text prompt (e.g., `tiny-gemini --prompt-file code.js --system "Explain"`)
- Streaming mode (`--stream`) now supports `--output-file` — text is accumulated silently and written at the end

## [1.0.0] - 2026-03-07

### Added

- **prompt** command (default) — text generation with multimodal file input (`--file`), system instructions (`--system`), structured JSON output (`--schema`), and streaming (`--stream`)
- **image** command with 7 sub-commands:
  - `generate` — text-to-image with batch options (`--count`, `--styles`, `--variations`)
  - `edit` — edit existing images with text prompts
  - `describe` — image understanding/analysis (uses text model)
  - `story` — multi-step narrative image sequences (`--steps`, `--type`, `--transition`)
  - `icon` — prompt-engineered icon generation (`--style`, `--type`, `--background`, `--corners`)
  - `pattern` — prompt-engineered pattern/texture generation (`--type`, `--density`, `--colors`)
  - `diagram` — prompt-engineered technical diagram generation (`--type`, `--layout`, `--complexity`)
- **tts** command — text-to-speech with WAV output (`--voice`, `--language`)
- **search** command — Google Search-grounded generation
- **research** command — Deep Research agent with background polling
- **raw** command — JSON passthrough to the Interactions API (arg, stdin, or `--file`)
- `.gemini/.env` file loader matching the official Gemini CLI convention (project-level search + `~/.gemini/.env` fallback)
- API key resolution chain: `--api-key` > `TINY_GEMINI_API_KEY` > `GEMINI_API_KEY` > `GOOGLE_API_KEY` > `.gemini/.env`
- SSE streaming parser for `--stream` flag
- Inline WAV header construction for TTS output (no ffmpeg dependency)
- Per-command model defaults (text: `gemini-2.5-flash`, image: `gemini-2.5-flash-image`, tts: `gemini-2.5-flash-preview-tts`, research: `deep-research-pro-preview-12-2025`)
- Per-command help (`tiny-gemini image --help`)
- `--json-output` flag for raw API response output
- `--preview` flag to auto-open generated files
- `--aspect-ratio` and `--image-size` options for image generation
- Image variation map with 7 categories (lighting, angle, color-palette, composition, mood, season, time-of-day)
- Platform-aware file opener (macOS `open`, Linux `xdg-open`, Windows `start`)

[2.0.0]: https://github.com/nicolasdao/tiny-gemini/compare/v1.2.0...v2.0.0
[1.2.0]: https://github.com/nicolasdao/tiny-gemini/compare/v1.1.0...v1.2.0
[1.1.0]: https://github.com/nicolasdao/tiny-gemini/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/nicolasdao/tiny-gemini/releases/tag/v1.0.0
