# Changelog

All notable changes to this skill will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this skill adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.5] - 2026-07-16

### Added

- Documented that this skill needs **no** configuration or API key — the `models` command is fully offline. Running a model needs a Gemini key, but that is managed by the CLI, not by any skill.

## [0.1.4] - 2026-07-16

### Changed

- Added `gemini-2.5-pro-preview-tts` (Audio, Preview, $1.00/$20.00, no free tier) to the model registry reference. Verbatim-verified against the live models + pricing pages on 2026-07-16.

## [0.1.3] - 2026-07-16

### Changed

- Add the GA image model `gemini-3.1-flash-lite-image` ("Nano Banana 2 Lite", GA 2026-06-30, 1K-only) and point the "cheapest image" decision rule at it, replacing the deprecated `gemini-2.5-flash-image` (shutdown 2026-10-02). Noted per-model aspect-ratio support and JPEG/PNG output. Verified against live docs 2026-07-16.

## [0.1.2] - 2026-06-08

### Changed

- Refresh model guidance for June 2026: GA image model IDs (`gemini-3.1-flash-image`, `gemini-3-pro-image`); added the GA text model `gemini-3.5-flash`; corrected `gemini-2.5-flash`'s replacement to `gemini-3.5-flash`; marked `gemini-2.5-flash-image` as sunsetting 2026-10-02; reverted `gemini-2.5-flash-preview-tts` to active Preview; and rebuilt the sunset calendar with per-model shutdown dates.

## [0.1.1] - 2026-05-10

### Fixed

- Removed `user-invocable: false` from the SKILL.md frontmatter so the skill can be invoked manually by the user via `/tiny-gemini-models`.

## [0.1.0] - 2026-05-10

### Added

- Initial release. Extracted from `nicolasdao/tiny-gemini` v1.x as part of the v2.0.0 suite decomposition.
- Documents the `models` command of the tiny-gemini CLI for offline Gemini model discovery.
- Includes decision rules for choosing the right model per use case.
- Covers `list`, `pricing` sub-commands and `--type`, `--status`, `--json` filters.
- Documents the 2026-10-16 sunset calendar for the Gemini 2.5 family.
