# Changelog

## [0.2.1] - 2026-05-07

### Changed
- `references/workflows.md` Kit Creation Workflow Step 2 — search example expanded to mention all three query forms supported by the new search dispatcher (API v2.9.0 / CLI v0.43.0): natural language for broad discovery, a single slug for typo-tolerant exact-name checks (e.g. `deploy-aws`), and `workspace/skill` form to scope to a specific workspace with typo tolerance on both halves (e.g. `acme/deploy-aws`). Documentation polish; behavior unchanged.

## [0.2.0] - 2026-05-04

### Added
- `references/suite-pattern.md` — new operational reference for the **Suite Pattern**, the canonical answer to the mega-skill problem. Covers the load-bearing orthogonal verb ownership rule, the five failure modes when orthogonality is violated, the five-slot description grammar, when to apply the pattern, the pre-publish orthogonality test, and suite-level anti-patterns. Links to `docs/cli-skill.md` for the citation-grade reference.
- New **Suite Decomposition Workflow** in `references/workflows.md` — eight phases, twenty-three numbered steps. Confirms mega-skill symptoms, maps the verb space into clusters, proposes the core + satellites split, drafts five-slot descriptions, runs the orthogonality test, generates files via `npx happyskills init`, validates each member, and coordinates release (satellites first, then the core).
- New Section 5 in `SKILL.md` — Suite Decomposition Workflow phase summary with key constraints and pointers to `references/suite-pattern.md` and `references/workflows.md`. Other sections renumbered (Authentication → 7, Validate Error Handling → 8, Constraints → 9).
- New routing triggers in `SKILL.md` Section 1 — "decompose this mega-skill", "split this skill", "build a skill suite", "this skill is doing too much", "my description is too long", "apply the suite pattern", "extract satellites", "refactor this into a suite", "fix the soft-cap warning".
- Audit Workflow (Section 4) extended with proactive mega-skill detection — flags description > 250 chars, primary verb count ≥ 4, triggers spanning unrelated domains, or routing tables with ≥ 5 verb clusters. Offers to run the Suite Decomposition Workflow via AskUserQuestion when symptoms are present.
- Audit Workflow gained a five-slot grammar check (Domain / Verb(s) / Object / Triggers / Negative) and a cross-skill orthogonality check that runs `npx happyskills list --json` to find siblings under the same namespace and identifies `<verb, object>` overlaps.

### Changed
- `references/skill-authoring.md` Section 5 ("Writing Effective Descriptions") rewritten to lead with the **five-slot grammar** as the canonical description format. Object is now a first-class slot alongside Domain, Verb(s), Triggers, and Negative — previously buried inside the verb-led clause. Added a step-by-step composition recipe (slot order: Domain → Verb → Object → Triggers → Negative) and a bad-vs-good worked example to make the format pattern-matchable for skill authors.
- `references/skill-authoring.md` Mega-Skill Problem section restructured to lead with the **Suite Pattern** as the canonical resolution strategy. Strategy 2 is now explicitly named "Suite Pattern" with a pointer to `references/suite-pattern.md` and the Suite Decomposition Workflow. The "When to recommend each strategy" table now flags Suite Pattern as the answer for any skill above 250 chars or naming ≥ 4 distinct primary verbs.
- Section 1 routing block in `SKILL.md` now links to `references/suite-pattern.md` as the canonical reference for orthogonal verb ownership and mega-skill decomposition.
- Section 8 (Validate Error Handling) now recommends the Suite Pattern over compression for descriptions above the 250-char soft cap, with a pointer to the new reference.

## [0.1.1] - 2026-05-03

### Added
- `references/cli-reference.md` — documents `init` syntax (skill and `--kit`), JSON response shape, result formatting, and common errors. Closes a documentation gap relative to v1.30.0 where `init`'s shape was the only command lacking new-family coverage.

### Changed
- Section 2 step 3 (Authoring Workflow) now links to `references/cli-reference.md` for full init details.

### Fixed
- Constraints now include "NEVER fabricate CLI flags or subcommands" and "ALWAYS run `npx happyskills` from the project root" — both were missing relative to the v1.30.0 mega-skill.
- Constraints now echo "NEVER run `npx happyskills login --password`" — credentials-leakage prohibition is now consistent across the whole family.
- Section 6 (Authentication) expanded with the headless-environment fallback message and the `already_logged_in` vs `logged_in` status detail — now consistent with the rest of the family.

## [0.1.0] - 2026-05-03

### Added
- Initial release of the HappySkills design skill.
- Owns greenfield skill design (Authoring Workflow), skill review/audit (Audit Workflow), session-learning-driven updates (Update Workflow), and guided kit creation (Kit Creation Workflow).
- `references/skill-authoring.md` — Claude Code skill spec: frontmatter, invocation models, description formula, forbidden characters, advanced patterns, best practices, anti-patterns, design patterns, the Mega-Skill Problem and decomposition strategies. Lifted from the original `happyskills` skill v1.30.0.
- `references/happyskills-conventions.md` — HappySkills superset: skill.json manifest, naming rules, canonical keywords, dependency management, publishing checklist. Lifted from v1.30.0.
- `references/workflows.md` — full procedures for Authoring, Update, Audit, and Kit Creation workflows. Lifted from v1.30.0.
- Audit workflow numerics updated from 850→250 chars (new spec soft cap from spec 260501-mega-skill-refactor).
- Created as part of the mega-skill refactor — the original 57-intent `happyskills` skill was split into 5 default skills + 1 opt-in. Design owns the "shape a skill" layer (creation, quality, improvement); publish owns the "ship a skill" layer (versioning, publishing, registry management).
