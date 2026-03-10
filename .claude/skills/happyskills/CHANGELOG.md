# Changelog

## [1.5.0] - 2026-03-10

### Added
- Add mandatory SKILL.md frontmatter validation step (name + description) to Post-Init, Post-Convert, and Post-Fork enrichment workflows — marked as NON-NEGOTIABLE to prevent skills from shipping without the description that drives auto-invocation
- Add "No frontmatter or missing description" as first entry in Common Debugging table in skill-authoring reference

### Changed
- Strengthen authoring workflow steps 4 and 6 with MANDATORY language — frontmatter block with `name` and `description` is now explicitly required, SKILL.md without frontmatter is never acceptable
- Mark `name` and `description` as **Required** in frontmatter field reference table
- Strengthen pre-release validation to check frontmatter name, description, placeholder detection, and forbidden character scanning before allowing bump/publish

## [1.4.0] - 2026-03-08

### Added
- Add `refresh` command routing, trigger phrases, and JSON shape documentation for the new check-and-update-all-in-one-shot CLI command
- Add invocation model confirmation step to Post-Init, Post-Convert, and Post-Fork enrichment workflows — always asks the user via AskUserQuestion before setting `disable-model-invocation: true`

### Changed
- Change `disable-model-invocation: true` to never be set by default — all skill creation, conversion, and fork workflows now require explicit user confirmation with a clear explanation of the consequences before adding this flag

## [1.3.2] - 2026-03-08

### Fixed
- Fix first-publish detection in publish pre-flight — replace unreliable `commit: null` lock file check with `npx happyskills check` registry query, which correctly handles locally developed skills that were already published

## [1.3.1] - 2026-03-08

### Fixed
- Enforce mandatory workspace resolution before every publish command — run `whoami` to get workspaces, check `skills-lock.json` for matching `<slug>/<skill-name>` entry, ask user only when ambiguous. NEVER run publish without `--workspace`
- Fix wrong lock file path references — corrected from `.claude-lock.json` to `skills-lock.json` (project root) across SKILL.md, skill-workflows.md, and happyskills-conventions.md
- Fix stale `happyskillsai/happyskills-cli` references — renamed to `happyskillsai/happyskills` in SKILL.md, json-shapes.md, and docs

## [1.3.0] - 2026-03-08

### Added
- Post-Init Enrichment workflow — authoring workflow (Section 7) now flows directly into HappySkills ecosystem metadata enrichment (description, keywords, dependencies, CHANGELOG) with optional publish, eliminating the need to manually `convert` after `init`

### Fixed
- Fix false dependency warning during publish — replaced broken `resolve_dependencies` call (which checked the unpublished skill itself) with per-dependency `get_repo` existence checks that run in parallel and name specific missing dependencies
- Enforce private-first visibility on first-time publish — AskUserQuestion now prescriptively lists "Private (Recommended)" as the first option in all publish and enrichment workflows

### Changed
- Authoring workflow step 8 now only verifies skill.json `name` and `version` — description, keywords, and dependencies are deferred to Post-Init Enrichment for a cleaner separation between SKILL.md design and ecosystem metadata

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
