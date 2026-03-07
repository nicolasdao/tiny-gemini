# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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

[1.0.0]: https://github.com/nicolasdao/tiny-gemini/releases/tag/v1.0.0
