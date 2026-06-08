# Changelog

## [0.1.1] - 2026-05-03

### Fixed
- Constraints now include "NEVER fabricate CLI flags or subcommands" — was missing relative to the v1.30.0 mega-skill.
- Constraints now echo "NEVER run `npx happyskills login --password`" — credentials-leakage prohibition is now consistent across the whole family.
- Section 2 (Authentication) expanded with the headless-environment fallback message — now consistent with the rest of the family.

## [0.1.0] - 2026-05-03

### Added
- Initial release of the HappySkills publish skill.
- Owns publish (with mandatory pre-flight checks), the full Skill Release Workflow (analyze changes + bump + changelog + publish), bump, validate, convert (external → managed), fork (with post-fork enrichment), delete from registry, and visibility management.
- `references/cli-reference.md` — exact CLI syntax and JSON response shapes for every publish-related command.
- `references/workflows.md` — full workflows: Skill Release, Post-Convert Enrichment, Post-Fork Enrichment, First-Time Publish, Workspace Resolution, Optional Fields Prompt (license/authors/repository/LICENSE generation).
- Created as part of the mega-skill refactor (spec 260501-mega-skill-refactor) — the original 57-intent `happyskills` skill was split into 5 default skills + 1 opt-in. Publish owns the full publish-and-distribute lifecycle.
