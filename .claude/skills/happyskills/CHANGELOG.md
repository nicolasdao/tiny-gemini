# Changelog

## [1.2.1] - 2026-03-07

### Fixed
- Stop re-prompting about visibility (public/private) when publishing a skill update — visibility is now only asked on the first publish and preserved automatically on subsequent publishes

## [1.2.0] - 2026-03-06

### Added
- Add Section 8 (Happy Skills) with status check workflow, conversion workflow, and tone guidelines — natural language support for "are my skills happy?", "make my skills happy", and related intents
- Add publish pre-flight checklist: managed check, CHANGELOG/skill.json read, change review, release workflow integration, and visibility confirmation before running `npx happyskills publish`

### Changed
- Change authentication flow from two-step (`login --json` + `login --browser`) to single command (`login --json --browser`) that handles both already-logged-in and fresh login cases

## [1.1.0] - 2026-03-06

### Changed
- Publish workflows (post-convert enrichment, release workflow, bare publish) now ask whether the skill should be public or private before running — skills are private by default
- Publishing Checklist in `happyskills-conventions.md` documents the `--public` opt-in flag and the private-by-default behavior

### Added
- `--public` flag example in the publish command reference

## [1.0.0] - 2026-03-06

### Added
- Natural language interface to all 16 `npx happyskills` CLI commands: `init`, `install`, `uninstall`, `list`, `search`, `check`, `update`, `bump`, `publish`, `convert`, `fork`, `login`, `logout`, `whoami`, `setup`, `self-update`
- Scoped search support: `--mine`, `--personal`, `--workspace <slug>`, `--tags` filters with browse mode (query optional when scope is provided)
- JSON output parsing for all commands with human-friendly result formatting (tables, summaries, counts)
- Browser-based device login flow with 6-minute timeout; password fallback for headless environments
- Automatic auth pre-flight check before auth-required commands (`publish`, `convert`, `fork`, `whoami`); auto-retry on `AUTH_REQUIRED` error
- Confirmation prompts via `AskUserQuestion` before destructive operations (`uninstall`, `publish`)
- Structured error handling by error code (`INTERACTIVE_REQUIRED`, `AUTH_REQUIRED`, `USAGE_ERROR`, `NETWORK_ERROR`, `API_ERROR`)
- Skill authoring expertise: 9-step workflow for designing Claude Code skills following the Claude Code spec (SKILL.md) and HappySkills conventions (skill.json, keywords, dependencies)
- Post-convert enrichment workflow: enriches `skill.json` metadata after `happyskills convert` succeeds
- Post-fork enrichment workflow: fills metadata for forked skills after `happyskills fork` succeeds
- Skill release workflow: analyzes changes, infers semver bump, updates changelog, validates, and publishes in one end-to-end pipeline
- Reference docs loaded on demand: `references/skill-authoring.md`, `references/happyskills-conventions.md`, `references/skill-workflows.md`, `references/json-shapes.md`
