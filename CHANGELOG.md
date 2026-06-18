# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [2.2.0] - 2026-06-18

### Added

- **Concurrent batch image generation** — `image` batches (`--count`/`--styles`/`--variations`, and `story` steps) now fan out **concurrently** instead of running one API call at a time. The Gemini Interactions API returns exactly one image per call (there is no `candidate_count`/`sample_count`/`number_of_images` parameter — that belongs to the separate Imagen `:predict` API), so N variations are necessarily N requests; this change cuts wall-clock latency from N× a single call to roughly `ceil(N / concurrency)`. New `--concurrency <n>` flag bounds parallelism (default 4) — lower it to avoid rate limits, raise it on generous quotas. A single failed call no longer aborts the batch: succeeded images are still saved and failures are summarized to stderr (or in the `failures` array under `--json`)
- **`--json` structured result envelope for image generation** — a curated, machine-readable result on stdout (distinct from `--json-output`, which dumps the raw API response): `{ model, image_size, count, cost_usd, cost_per_image_usd, cost_estimated, images: [{ index, path, format, width, height, bytes, prompt, cost_usd }], references?, failures? }`. Pixel `width`/`height` are parsed directly from the returned bytes (zero-dep JPEG/PNG/WebP header reader); paths are deterministic; cost is estimated from the offline `models.json` registry. Lets an agent chain reliably instead of guessing the path/extension or parsing stderr
- **`--dry-run`** — print the estimated cost and the resolved prompts, then exit without calling the API. Use to confirm spend before a large or high-resolution batch (`--dry-run --json` emits a JSON estimate)
- **`--out <name>`** — explicit base output filename for generated images (an index `_1`, `_2`, … is appended for batches)
- **Reference images now compose with `--count`/`--styles`/`--variations`** — previously these were ignored when `--file` reference images were supplied. Each variation is now an independent call sharing the same reference parts, so `--count=3 --file ref.png` returns 3 candidates built from `ref.png`. The reference mapping is also surfaced in the `--json` envelope as `references`
- **`--count` on `edit`, `icon`, `pattern`, `diagram`** — the preset and edit sub-commands now accept `--count` (and `edit` accepts `--styles`/`--variations`) to produce several candidates of the same request, routed through the same concurrent batch runner as `generate`
- **`models.json`: structured `image_cost_by_size`** for the GA image models (`gemini-3.1-flash-image`, `gemini-3-pro-image`), so per-image cost estimates read from the registry (single source of truth) rather than being hardcoded

### Changed

- All image-generation sub-commands (`generate`, `edit`, `story`, `icon`, `pattern`, `diagram`) now run through one shared batch runner, so `--json`, `--out`, `--dry-run`, `--concurrency`, and cost estimation behave consistently across every sub-command

## [2.1.0] - 2026-06-18

### Added

- **Reference images for `image generate`** — `--file` is now repeatable (up to 14) on the `image generate` sub-command, letting you compose, blend, or style-transfer from multiple input images. Images are bound to **Image A, Image B, Image C…** by `--file` order and the prompt refers to them by those labels, following Google's published multi-image prompting guidance (one text prompt first, then the image parts; each image given an explicit role). Use `--file name=path` to label a file — its name is appended to the prompt as a legend so the prompt can reference it by name. The CLI prints the `Image A = <file>` mapping to stderr. Built as an `input` array of `[{type:'text'}, {type:'image'}, …]` (the existing multimodal shape, with multiple images). `--count`/`--styles`/`--variations` are ignored when reference images are present. As a side effect, `--file` is now also repeatable on the default `prompt` command (multiple multimodal attachments)

## [2.0.1] - 2026-06-08

### Changed

- **Default image model is now the GA `gemini-3.1-flash-image`** (was the preview `gemini-3.1-flash-image-preview`). Google deprecated both preview image models on 2026-05-28 with a **2026-06-25 shutdown**; the GA models (`gemini-3.1-flash-image`, `gemini-3-pro-image`, launched 2026-05-28) are drop-in replacements at the same pricing. The deprecated preview IDs are now in the sunset list so explicit `--model` use gets a warning (and a hard error after 2026-06-25)
- **Per-model shutdown dates** — `checkSunset` previously assumed a single global shutdown date (2026-10-16). It now reads a per-model date so the preview image models (2026-06-25) and `gemini-2.5-flash-image` (2026-10-02) warn with their correct dates
- **Model registry refresh** (`models.json`, snapshot 2026-06-08): added GA `gemini-3.1-flash-image`, `gemini-3-pro-image`, and the new GA text model `gemini-3.5-flash`; marked the two preview image models and `gemini-2.5-flash-image` deprecated with their shutdown dates; corrected `gemini-2.5-flash`'s replacement pointer to `gemini-3.5-flash`; reverted `gemini-2.5-flash-preview-tts` to active `preview` status (it is still listed as Preview on Google's models page, not deprecated)

### Fixed

- **Image generation and TTS broken on the Interactions API** — the CLI sent `response_modalities` as uppercase enum values (`['IMAGE']`, `['AUDIO']`), carried over from the older `generateContent` convention. The Interactions API (`/v1beta/interactions`) rejects these with `400 The value 'IMAGE' is not supported for 'response_modalities[0]'. Supported values: 'text', 'image', 'audio', 'video', 'document'.` All image sub-commands that produce images (`generate`, `edit`, `story`, `icon`, `pattern`, `diagram`) and the `tts` command now send lowercase values (`['image']`, `['audio']`). `describe` was unaffected (text model, no modality). Docs and the raw-API skill reference updated to lowercase
- **`--image-size` lowercase rejected** — the API requires an uppercase `K` suffix (`2K`, not `2k`). The image help text wrongly listed `(1k, 2k, 4k)`; it now reads `512, 1K, 2K, 4K (uppercase K required)`, and the CLI normalizes a trailing lowercase `k` before sending so a user typing `2k` no longer gets a 400
- **TTS `speech_config` shape** — the May 2026 Interactions schema requires `speech_config` to be an array of speaker entries, even for a single speaker. The CLI sent a bare object (`{ language, voice }`), which the new schema rejects; it now sends `[{ language, voice }]`. Voice names are title-case in the API, so the CLI capitalizes the first letter of `--voice` (default is now `Kore`)
- **TTS audio output handling** — the WAV wrapper only triggered on an exact `audio/pcm` mime label. Gemini may label the raw PCM as `audio/l16` (or `audio/L16;rate=24000`); `saveOutput` now matches any `audio/pcm` or `audio/l16` variant, wraps it as WAV, and forces a `.wav` extension, so the saved file is always playable
- **Deep Research polling** — `pollCompletion` only treated `failed`/`cancelled` as terminal and would otherwise poll forever. It now also stops on `incomplete`, `budget_exceeded`, and `expired` (surfacing any `error.message`), and exits with a clear message on `requires_action` (which the research flow cannot satisfy)

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
