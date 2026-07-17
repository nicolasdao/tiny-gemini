# Changelog

All notable changes to this skill will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this skill adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.0] - 2026-07-17

### Added

- **Reference-image best practices playbook**, mined from the official Omni docs and the Gemini image prompting guides. The skill now teaches: the three image roles (`--first-frame`/`<FIRST_FRAME>` vs `--file`/`<IMAGE_REF_0..N>` for style/subject references), how the tags bind by `--file` order (read the CLI's printed mapping), cinematographer prompt construction (subject/action/framing/lens/lighting/location/style), timed `[0-3s]` segments, text-on-screen syntax, and the fact that **Omni generates audio** (always describe it).
- Documented the exclusions rule (no negative-prompt/seed/temperature fields → phrase negatives in the prompt), the two-only aspect ratios, editing + `--previous` refinement, and the hard limits (audio-input unsupported, video-reference unusable, EEA/CH/UK uploaded-video-editing restriction).
- Reflects the CLI's new `--first-frame`, `--file` reference-tag mapping, and `--task` flags (live-verified `reference_to_video` round-trip, 2026-07-17).

## [0.1.0] - 2026-07-17

### Added

- Initial release. Documents the tiny-gemini CLI `video` command (Gemini Omni Flash, `gemini-omni-flash-preview`): text→video and image→video `generate`, video/image `edit`, conversational refinement via `--previous`, `--aspect-ratio` (16:9 / 9:16), `--count` candidate batches, the `--json` envelope (with actual per-usage cost and interaction ids), and `--dry-run`.
- Covers output specs (MP4, 720p, 24fps, 3–10s), URI-delivery download, pricing (~$0.10/second of 720p, no free tier), the SynthID watermark, and the EEA/CH/UK video-editing regional restriction.
- Notes the distinction from Veo (a separate `:predictLongRunning` API reachable via the core `raw` command).
