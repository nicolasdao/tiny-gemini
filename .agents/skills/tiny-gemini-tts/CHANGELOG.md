# Changelog

All notable changes to this skill will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this skill adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.0] - 2026-07-17

### Changed

- Documented that the Gemini API key is **CLI-managed** — added an "API Key" section covering the CLI's resolution order and not-found behavior. No skill-level secret/`env`; reverted an earlier same-day draft that declared a `skills-config` secret, since key management is the CLI's responsibility.

## [0.1.4] - 2026-07-16

### Changed

- Noted `gemini-2.5-pro-preview-tts` as a selectable 2.5-family TTS model (Preview, $1.00/$20.00, no free tier) alongside `gemini-2.5-flash-preview-tts`. Documented that the API added streaming TTS for `gemini-3.1-flash-tts-preview` (2026-06-17) but the CLI's `tts` command writes a non-streaming WAV — use `raw` with `"stream": true` for streamed audio.

## [0.1.3] - 2026-07-16

### Changed

- Update the multi-speaker `raw` example to the current Interactions schema: audio output is declared by `response_format: { "type": "audio" }` (the removed `response_modalities: ["audio"]` field is gone as of the 2026-06-08 schema cutover). `speech_config` still lives under `generation_config`.

## [0.1.2] - 2026-06-08

### Fixed

- Correct the multi-speaker `raw` example to lowercase `response_modalities: ["audio"]` — the Interactions API rejects the uppercase `["AUDIO"]` form.

### Changed

- Use title-case voice names (default now `Kore`), note that `speech_config` is an array even for a single speaker, and drop the inaccurate "deprecated" framing for `gemini-2.5-flash-preview-tts` (still active Preview).

## [0.1.1] - 2026-05-10

### Fixed

- Removed `user-invocable: false` from the SKILL.md frontmatter so the skill can be invoked manually by the user via `/tiny-gemini-tts`.

## [0.1.0] - 2026-05-10

### Added

- Initial release. Extracted from `nicolasdao/tiny-gemini` v1.x as part of the v2.0.0 suite decomposition.
- Documents the `tts` command of the tiny-gemini CLI for Google Gemini text-to-speech.
- Default model `gemini-3.1-flash-tts-preview` (April 2026 launch).
- Covers single-speaker via the `tts` command and multi-speaker via the core `raw` command.
