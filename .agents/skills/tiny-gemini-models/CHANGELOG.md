# Changelog

All notable changes to this skill will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this skill adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
