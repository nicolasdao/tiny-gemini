# Changelog

All notable changes to this skill will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this skill adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.3.2] - 2026-06-19

### Added

- Document that `edit` also accepts `--styles`/`--variations` (not just `--count`) — they fan an edit across styles/variations exactly as they do for `generate` (e.g. `image edit photo.png "add a hat" --styles=watercolor,sketch` → two styled edits). Previously the skill scoped `--styles`/`--variations` to `generate` only, under-documenting a working `edit` capability. Updated the SKILL.md batch table and the `edit` section of `references/image-commands.md`.

## [0.3.1] - 2026-06-18

### Fixed

- Corrected a determinism inaccuracy in `references/image-commands.md`: the batch-options table listed `--count` as applying to `story`, but `story` uses `--steps` for its sequence length and ignores `--count`. The `--count` row now scopes to `generate`/`edit`/`icon`/`pattern`/`diagram` and points `story` users to `--steps` (mirrored in SKILL.md).
- Clarified that `describe` (image understanding) ignores the image-config and batch/output flags (`--aspect-ratio`, `--image-size`, `--count`, `--concurrency`, `--json`, `--out`, `--dry-run`) — it returns text and supports only `--stream`/`--json-output`.

## [0.3.0] - 2026-06-18

### Added

- Document the **batch & output flags** for CLI v2.2.0: `--count` candidate generation across all image sub-commands (now including `edit`/`icon`/`pattern`/`diagram`), `--concurrency` bounded parallelism (one image per API call, so N variations are N concurrent requests), the `--json` structured result envelope (deterministic paths, pixel dimensions, bytes, format, estimated cost, reference mapping), `--dry-run` cost preview, and `--out` base filename. Added a "Batch, Concurrency & Output" section to SKILL.md and a "Batch & output options" section to `references/image-commands.md`.

### Changed

- Reference images now **compose** with `--count`/`--styles`/`--variations` (each variation is its own call sharing the references) — corrected the previous "ignored when references are present" note throughout SKILL.md and the reference doc.
- Output guidance now recommends `--json` for reliable chaining (read exact paths from the envelope instead of parsing stderr) and `--dry-run` to preview cost before large batches.

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
