# Changelog

## [0.2.1] - 2026-05-10

### Fixed
- SKILL.md § 2 (Smart Skill Discovery) — tightened the "intelligence layer" framing to scope the concierge's reasoning role to query formulation, decomposition, and explaining fit. The API's `relevance_score` order is now explicitly named as authoritative (it already fuses semantic similarity, full-text match, and quality signals server-side), with a cross-reference to § 8 for the presentation rule.
- SKILL.md § 8 (Present Results) — added a "Result ordering — strict rule" block to the search-results bullet. Requires presenting results in the exact API order (`relevance_score` desc), prefixing the table with a line stating the ranking source (e.g. "Top results ranked by the HappySkills search engine for `<query>`:"), and forbids default re-sorting by `quality_score` / downloads / stars even when relevance values look clustered. Re-ranking is now an exception, allowed only on explicit user request or with a stated project-context reason; when applied, the API's order must be shown first and the alternative presented as a labeled view with a one-sentence reason.
- SKILL.md § 9 (Constraints) — added: "NEVER silently re-order search results — the API's `relevance_score` order is authoritative."

### Notes
- Behavior fix prompted by a real-world incident: the concierge silently re-sorted `agent-browser` search results by `quality_score`, putting a quality-81 result ahead of the API's #1 (relevance 3.001127). The relevance gap was ~0.00005 and the model treated it as noise. Small relevance gaps reflect the ranker's calibrated confidence — re-sorting by quality double-counts a signal already inside `relevance_score`. No API or dependency changes.

## [0.2.0] - 2026-05-07

### Changed
- SKILL.md § 2 (Smart Skill Discovery) — rewrote the search-command paragraph to describe the new dispatcher: the server inspects query *shape* and routes automatically to one of four ranking strategies (`semantic` / `fuzzy_slug` / `fuzzy_scoped` / `list`). The chosen strategy is echoed back in the response as `mode`. Repositions `--exact` as the explicit escape hatch (skip the dispatcher, force keyword-only FTS) instead of the binary opposite of "smart". Concierge no longer pre-decides the mode — it sends the raw query and reads `mode` to verify.
- `references/smart-search.md` Stage 1 intent table — split the legacy "User names a specific skill → Exact search" row into two: **Name lookup** (write the slug, server auto-routes to `fuzzy_slug`, typo-tolerant) and **Scoped name lookup** (write `workspace/skill`, server auto-routes to `fuzzy_scoped`, typo-tolerant on both halves).
- `references/smart-search.md` JSON Response Shape — example payload and field reference table updated to the new envelope: top-level `mode` now enumerates the four modes, plus three new top-level fields (`match_notice`, `workspace_match`, `workspace_candidates`) and a per-row `match_quality` row clarifying that the label source differs by mode (cosine for `semantic`, trigram tier for `fuzzy_slug` / `fuzzy_scoped`, `null` in `list`).
- `references/smart-search.md` Constraints — `--json` constraint now mentions reading the response's `mode` field to confirm which strategy ran.

### Added
- `references/smart-search.md` — new top-level "How the server picks a strategy (the dispatcher)" section right after the Command. Documents the shape-based routing rules, lists the four modes with their triggers, and frames `--exact` as the deterministic-FTS escape hatch.
- `references/smart-search.md` — new Stage 4 sub-section **"Choosing query form for known skills"**: a 3-row table mapping user phrasing ("find the deploy-aws skill" / "find letta-ai/remotion" / "find the exact slug, no fuzzy") to the right query form (bare slug / `workspace/skill` / `--exact`) and the resulting server mode. Calls out `fuzzy_scoped` as the path that closes the principal aha "I didn't know my team already had a skill for this." Includes `--limit 5` guidance for name lookups.
- `references/smart-search.md` — new Stage 5 sub-section **"Reading the `mode` field — and the honest-failure path"**: three uses for the response's `mode` field (sanity-check routing, interpret `match_quality` correctly per mode, detect the `fuzzy_scoped` workspace-not-found case). Includes the example JSON for `workspace_match: null` and the recommended user-facing copy ("I couldn't find a workspace called `helo` — did you mean a different workspace, or should I search globally without the prefix?").
- `references/smart-search.md` Constraints — new rule: never silently rewrite the user's query when the workspace half of `workspace/skill` doesn't match. Surface the honest failure verbatim and ask what they meant.
- `references/feature-map.md` Section 2 (Search & Discovery) — two new natural-language → command rows: "find the X skill" / "is there a skill called X" → bare-slug search; "find ws/skill" / "the X skill in ws" → `workspace/skill` form. The scoped-form row also reminds the concierge to surface the `workspace_match: null` honest failure rather than silently searching globally.

### Notes
- This is an additive update reflecting platform changes shipped in API v2.9.0, CLI v0.43.0, and Web v0.25.0. No breaking change to the agent's mental model — the legacy `POST /repos:semantic-search` endpoint and CLI `--exact` flag continue to work; the dispatcher just makes typo-tolerant slug and `workspace/skill` lookups the default for queries that look like names.

## [0.1.4] - 2026-05-04

### Added
- `references/smart-search.md` JSON Response Shape now documents the two new cluster-related fields returned by the API's near-duplicate suppression: `results[].similar_count` (integer ≥0) and `results[].similar_repos` (array, max 5). Field-level reference table grew from 16 to 18 rows; the example payload illustrates a populated cluster.
- New "Note on near-duplicate clusters" subsection in Stage 5 (Synthesize) — instructs the concierge to treat each top-level result as canonical, not re-search for variants, and surface "+N similar variants exist" only when the user explicitly asks for alternatives.

## [0.1.3] - 2026-05-04

### Added
- New Section 3 in SKILL.md — **Version & Changelog Lookup** — covering the new `versions` and `changelog` CLI commands (CLI v0.41.0). Concierge now owns both as read-only registry lookups that help the user pick a version before installing.
- New routing rows in Section 1 for "what versions of X exist", "list versions of acme/foo", "show me the changelog for X", "what changed in X", "release notes for X", "when did feature Y ship in X".
- New disambiguation rule: version/changelog lookups belong here; *applying* a version (`install acme/foo@1.2.0`) belongs to core. Crisp boundary so the concierge doesn't accidentally install on behalf of the user.
- New reference [`references/version-history.md`](references/version-history.md) — exhaustive guide for both commands: signatures, flag semantics, JSON response shapes, field-level reference tables, the `synthesized: true` fallback for skills with no `CHANGELOG.md`, edge cases, presentation patterns, the combined "help me pick a version" workflow, authentication rules, and what these commands are NOT for.
- New entries in `references/feature-map.md` Quick Lookup and Section 2 (Search & Discovery) routing tables for the new commands.
- Updated Section 8 (Present Results) with rendering guidance for `versions` and `changelog` JSON output, including the mandatory disclosure when `synthesized: true`.
- Constraint additions: never invent skill versions not returned by `versions`; do not add `--limit` defensively to `versions` (only when the user explicitly asks).

### Changed
- Renumbered SKILL.md sections to make room for the new Section 3: Family Overview is now Section 4, Feature Routing is Section 5, Install-on-Recommendation is Section 6, Authentication is Section 7, Present Results is Section 8, Constraints is Section 9. All internal cross-references updated; `references/feature-map.md` Section 6 cross-reference updated to point at the new Section 6 of SKILL.md.
- Skill description updated to mention version/changelog browsing while staying under the 250-char soft cap (236 chars).

## [0.1.2] - 2026-05-04

### Added
- `references/family-overview.md` now names the **Suite Pattern** as the architectural pattern HappySkills implements, with a routing instruction: when a user is facing the mega-skill problem in their own skills, the concierge directs them to `happyskills-design` ("decompose this mega-skill" or "audit this skill"). Pointers to `docs/cli-skill.md` for the canonical reference.

## [0.1.1] - 2026-05-03

### Added
- Routing table now includes 4 rows for workspace-scope flags: `--mine` (personal + every org), `--personal` (personal only), `--workspace <slug>` with query, and `--workspace <slug>` browse mode. Restored from the v1.30.0 mega-skill.
- New disambiguation rule for workspace-scope flag selection — default to `--mine` for "my skills", never run separate `--personal` + per-org `--workspace` calls when `--mine` would do it in one.
- `references/smart-search.md` now includes a "Workspace Scope Flags" subsection documenting when to pick each flag.
- `references/smart-search.md` now includes a 16-field reference table for the search JSON response shape (query, mode, all `results[]` fields, count) — restored field-level docs from the v1.30.0 `json-shapes.md` reference.

### Fixed
- Constraints now include "NEVER fabricate CLI flags or subcommands" and "ALWAYS run `npx happyskills` from the project root" — both were missing relative to the v1.30.0 mega-skill.
- Constraints now echo "NEVER run `npx happyskills login --password`" — credentials-leakage prohibition is now consistent across the whole family.

## [0.1.0] - 2026-05-03

### Added
- Initial release of the HappySkills concierge skill.
- Owns search/find/recommend (smart marketplace discovery) and ask/explain/what-is/how-does (HappySkills Q&A).
- `references/family-overview.md` — friendly explanation of the HappySkills product and the 5-skill family (for "what is HappySkills?" questions).
- `references/feature-map.md` — routing table that maps user requests to the right family-member skill.
- `references/smart-search.md` — full smart-discovery reasoning guide (lifted from the original happyskills SKILL.md Section 11 + reference, v1.30.0).
- Install-on-recommendation flow for opt-in satellites (currently only `happyskills-collab`).
- Created as part of the mega-skill refactor (spec 260501-mega-skill-refactor) — the original 57-intent `happyskills` skill was split into 5 default skills + 1 opt-in.
