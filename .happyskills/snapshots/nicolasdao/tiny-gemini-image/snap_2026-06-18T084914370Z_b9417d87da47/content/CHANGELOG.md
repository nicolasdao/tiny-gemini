# Changelog

All notable changes to this skill will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this skill adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.2.0] - 2026-06-18

### Added

- Document **reference-image generation** for `image generate` — `--file` is repeatable (up to 14), images bind to Image A/B/C by `--file` order, `--file name=path` labels a file and injects a legend into the prompt, the CLI echoes the mapping to stderr, non-image files are rejected, and `--count`/`--styles`/`--variations` are ignored when references are present. Covers Google's published multi-image prompting pattern (one text prompt first, image parts after, each image given an explicit role) and per-model reference limits. Added a routing trigger ("creating or combining images") to the description and a "combine/blend" row to the scope table.

### Fixed

- Output section no longer claims generated images are always `.png` — the GA image models return JPEG, so saved files match the response MIME type (usually `.jpg`).

## [0.1.2] - 2026-06-08

### Changed

- Update the default image model to the GA `gemini-3.1-flash-image` and the Pro override to `gemini-3-pro-image`. The previous `-preview` IDs are deprecated and shut down 2026-06-25.

## [0.1.1] - 2026-05-10

### Fixed

- Removed `user-invocable: false` from the SKILL.md frontmatter so the skill can be invoked manually by the user via `/tiny-gemini-image`.

## [0.1.0] - 2026-05-10

### Added

- Initial release. Extracted from `nicolasdao/tiny-gemini` v1.x as part of the v2.0.0 suite decomposition.
- Documents every `image` sub-command of the tiny-gemini CLI: `generate`, `edit`, `describe`, `story`, `icon`, `pattern`, `diagram`.
- Covers all image-config flags (`--aspect-ratio`, `--image-size`, sub-command-specific options).
- Aligned with the May 2026 Interactions API schema (image config inside `response_format` with `"type": "image"`).
