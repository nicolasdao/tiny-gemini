# Changelog

All notable changes to this skill will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this skill adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-05-10

### Added

- Initial release. Extracted from `nicolasdao/tiny-gemini` v1.x as part of the v2.0.0 suite decomposition.
- Documents every `image` sub-command of the tiny-gemini CLI: `generate`, `edit`, `describe`, `story`, `icon`, `pattern`, `diagram`.
- Covers all image-config flags (`--aspect-ratio`, `--image-size`, sub-command-specific options).
- Aligned with the May 2026 Interactions API schema (image config inside `response_format` with `"type": "image"`).
