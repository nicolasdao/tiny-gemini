# Changelog

## [0.1.1] - 2026-05-03

### Fixed
- Constraints now include "NEVER fabricate CLI flags or subcommands" and "ALWAYS run `npx happyskills` from the project root" — both were missing relative to the v1.30.0 mega-skill.
- Constraints now echo "NEVER run `npx happyskills login --password`" — credentials-leakage prohibition is now consistent across the whole family.
- Section 9 (Authentication) expanded with the headless-environment fallback message and the `already_logged_in` vs `logged_in` status detail — now consistent with the rest of the family.

## [0.1.0] - 2026-05-03

### Added
- Initial release of the HappySkills sync skill.
- Owns `status`, `pull`, `diff`, merge-conflict resolution, publish-failure diagnosis, and AI merge review.
- `references/merge-workflows.md` — full playbooks for status diagnosis, pull strategies, three-way merge mechanics, conflict resolution, publish-after-merge, TOCTOU handling, and `--full-report` AI review (lifted from the original `happyskills` skill v1.30.0).
- `references/cli-reference.md` — exact CLI syntax and JSON response shapes for `status`, `pull`, and `diff`.
- Created as part of the mega-skill refactor (spec 260501-mega-skill-refactor) — the original 57-intent `happyskills` skill was split into 5 default skills + 1 opt-in. Sync owns the Git-aligned sync layer: divergence detection, conflict resolution, and publish-after-merge intelligence.
