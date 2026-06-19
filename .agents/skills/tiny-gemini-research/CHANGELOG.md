# Changelog

All notable changes to this skill will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this skill adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.1] - 2026-05-10

### Fixed

- Removed `user-invocable: false` from the SKILL.md frontmatter so the skill can be invoked manually by the user via `/tiny-gemini-research`.

## [0.1.0] - 2026-05-10

### Added

- Initial release. Extracted from `nicolasdao/tiny-gemini` v1.x as part of the v2.0.0 suite decomposition.
- Documents the `research` command of the tiny-gemini CLI for Google Deep Research agents.
- Default agent `deep-research-preview-04-2026` (April 2026 launch). Comprehensive variant `deep-research-max-preview-04-2026` available via `--model`.
- Documents background polling execution model and disambiguation vs the core `search` command.
