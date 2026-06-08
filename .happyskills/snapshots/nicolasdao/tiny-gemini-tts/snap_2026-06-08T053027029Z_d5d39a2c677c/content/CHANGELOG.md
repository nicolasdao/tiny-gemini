# Changelog

All notable changes to this skill will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this skill adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.1] - 2026-06-08

### Fixed

- Correct the multi-speaker `raw` example to lowercase `response_modalities: ["audio"]` — the Interactions API rejects the uppercase `["AUDIO"]` form.

### Changed

- Use title-case voice names (default now `Kore`), note that `speech_config` is an array even for a single speaker, and drop the inaccurate "deprecated" framing for `gemini-2.5-flash-preview-tts` (still active Preview).

## [0.1.0] - 2026-05-10

### Added

- Initial release. Extracted from `nicolasdao/tiny-gemini` v1.x as part of the v2.0.0 suite decomposition.
- Documents the `tts` command of the tiny-gemini CLI for Google Gemini text-to-speech.
- Default model `gemini-3.1-flash-tts-preview` (April 2026 launch).
- Covers single-speaker via the `tts` command and multi-speaker via the core `raw` command.
