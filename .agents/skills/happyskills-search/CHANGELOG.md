# Changelog

## [0.3.2] - 2026-06-06

### Changed
- Restructured `capabilities` into tighter clusters (`find-skills`, `browse-skill-history`, `manage-favorites`) with richer, synonym-varied intents for sharper `happyskills resolve` matching (spec 260606-01). Additive metadata; no behavior change.

## [0.3.1] - 2026-06-06

### Added
- Declared the `discover-skills` capability in `skill.json` (owns search/versions/changelog/star/unstar/postlex) so `happyskills schema` and `happyskills resolve` can route discovery intents to this skill (spec 260606-01). Additive metadata — older CLIs ignore it; no behavior change.

## [0.3.0] - 2026-06-03

### Added
- **`--favorites` search scope.** Section 2 Step B.5 now resolves "my favorites" / "skills I starred" intent to the `--favorites` flag, and Section 3 documents it in the scope-flags table with examples. Favorites restricts results to the skills the user has starred (auth required); a bare `--favorites` with no query browses all of them (list mode), and it combines with a query to search within favorites. It routes through the smart dispatcher and is not compatible with `--exact`.
- **Section 7 — Star and unstar (curate favorites).** Documents the `star <owner/name>` and `unstar <owner/name>` commands — the curation half of favorites. Covers auth, idempotency, the published-vs-not (not local-vs-remote) rule for what can be starred, when to invoke, and boundaries.
- **Star state in results.** Section 6 now surfaces the per-row `starred_by_me` flag and offers to star/unstar a result, wiring the find → star → re-find loop.

### Changed
- **Description widened to cover favorites/star** (frontmatter + skill.json), with new keywords `favorites` and `star`. Search remains the sole owner of the star/favorites verbs across the constellation.

## [0.2.2] - 2026-06-01

### Fixed
- **Post-rerank clarification dispatch.** Path B now matches the CLI's `clarify_query` action and reads `suggested_questions` / `max_turns_remaining` from `next_step.context` (was the bare `clarify` action + root-level fields, so the branch never fired); the phantom `next_step.input_template` is replaced with `rerank_response_schema`.

### Changed
- **Envelope/shape docs aligned to the canonical six-key envelope** — the discovery-protocol intro, the SKILL.md error block, and the `smart-search.md` honest-failure payload (now nested under `data` with `results: []`, dropping the never-emitted `workspace_candidates` from the CLI-side example).

## [0.2.1] - 2026-05-28

### Changed
- **Section 3 Step F simplified** — dropped the defensive "next_step lives at the root, NOT inside data" prose now that root placement is the canonical invariant of the canonical six-key response envelope (spec 260525-cli-default-json § 4). The step now reads as "Read the envelope" and points directly at `response.next_step.action` for dispatch.
- **Anti-patterns list (Section 3 end)** — the legacy "Checking `data.next_step` instead of `next_step` at the root" item is replaced by a precondition check: an empty `next_step` while `--with-rerank` is set on a `semantic`-mode dispatch is a bug, not a no-protocol-applies signal.

## [0.2.0] - 2026-05-25

### Added
- **Section 2 Step B.5 — Detect scope intent and resolve a flag.** Before formulating any query, the skill now examines the user's request for workspace scope intent expressed in prose ("in my workspace", "my personal account", "from acme", possessive "my X skill") and resolves it to a concrete CLI flag — `--mine` (personal ∪ orgs), `--personal` (personal only), or `--workspace <slug>`. Slash form (`acme/foo`) continues to auto-route via `fuzzy_scoped` and is honored as "explicit beats inferred" when both signals are present. Resolution rules are deterministic and table-driven (six rows, first match wins).
- **Section 1 — new top-row routing case.** "Scope-named lookup" is now the first row of the routing table, ahead of fan-out cases. It directs the agent to Step B.5 before re-entering the table for the underlying query shape. Scope and topic are framed explicitly as orthogonal axes that must both be honored.
- **Section 2 Step D — explicit scope statement in the search preamble.** When a scope flag was resolved, the preamble now states the scope before the topic ("Searching across all your workspaces (`--mine`) for skills that..."), giving the user a cheap correction window on the higher-leverage axis before the search burns.
- **Section 3 Step E — scope-flag reference table.** New table documenting the three scope flags, their server-side effect, auth requirements, and combination rules with `--with-rerank`. Confirms that scope filtering applies inside the HNSW + FTS CTEs before RRF / MMR / digest construction — the rerank only ever sees in-scope candidates.

### Fixed
- **Unscoped registry-wide search when the user named a workspace in prose.** Previously, "find me a release skill **in my personal account**" produced an unscoped semantic search and surfaced the right private skill at #1 only by luck. The `quality_fallback` (0.66) for unscored skills (typical of personal/draft workspaces) could lose to a registry-wide false-positive with a marginally higher `final_score`, masquerading as a correct result. Step B.5 closes this failure mode by routing scope intent to the appropriate flag before search.

### Changed
- **Section 3 anti-patterns + Section 7 constraints — auth hard-fail rule, no silent fallback.** `--mine` and `--personal` require authentication; when the user names such a scope while logged out, the skill now stops and surfaces the auth requirement plainly instead of falling back to a registry-wide search. The transparency-over-magic principle from the mission is operationalized as a non-negotiable constraint.

### Notes
- No CLI or API change required. The plumbing for `--mine` / `--personal` / `--workspace` has been correct end-to-end since `happyskills@0.49.0` (CLI sends `scope` body field; API filters inside the vec/fts CTEs before ranking). This release is purely a SKILL.md update — the always-loaded prose now points the agent at the flags that already existed.
- The reference doc `references/smart-search.md` already documents the scope flags correctly (§ Workspace Scope Flags). This release promotes that knowledge from the on-demand reference into the always-loaded SKILL.md so it is reachable without a reference fetch.

## [0.1.0] - 2026-05-24

### Added
- **Initial release.** Extracted from `happyskills-help@0.3.3` to give discovery its own dedicated home in the HappySkills constellation. Search is now an official default-bundled satellite alongside `happyskills-design`, `happyskills-publish`, `happyskills-sync`, and `happyskills-help`.
- **Section 1 — the core "am I hedging?" rule.** The skill's primary routing decision is made by inspecting the agent's own intent before searching: a fan-out into 2+ parallel searches triggers a self-check — can each search be named with a distinct, project-grounded reason? If yes, it's decomposition; search. If no, it's hedging; clarify first. This replaces the older "classify by user phrasing" pattern (directive vs invitation), which was fragile in the middle of the query spectrum (curveball cases like "build a legal blockchain SaaS"). The cause-based rule routes all five query shapes — slug-explicit, single-focused, decomposable, curveball, vague — correctly.
- **Section 2 — generalized pre-flight** (project context + `list --json` + conditional clarify + decomposition preamble). Steps A and B run on every non-slug query because project context is a rerank-quality input, not just a query-formulation input. Step C (clarify) is the only register-conditional step. Step D (state decomposition before searching) is the user-facing instance of "transparency over magic" — the user gets a cheap chance to redirect before the search budget is burned.
- **Session-first context rule** (Section 2 Step A). Project context is sourced in priority order: current session context → disk files → `list --json`. The agent uses what it already has before re-reading files or re-asking questions the user has already answered — this is what makes the pre-flight cost roughly proportional to how *new* the discovery thread is.
- **Two circuit-breakers against infinite-loop failure modes** (Section 2 Step C). (1) Discovery-thread state flag: once a clarifying question has been answered, the gate flips to "search permitted" for the rest of the thread; subsequent fan-outs go through without re-litigation. (2) Hard turn budget: 2 clarifying turns maximum per thread, shared between the skill's out-of-band AskUserQuestion calls and the CLI's `--clarification-turns-used` counter. Together these guarantee termination even if the cause-based rule misfires.
- **Section 3 — the deterministic rerank loop** (search → next_step → dispatch → postlex → present). Carries forward verbatim from `happyskills-help@0.3.3` Section 2 Steps 1–4 + anti-patterns, including the `--search-output` recipe from `happyskills@0.48.0` and the "next_step lives at the response root" pattern from `happyskills-help@0.3.1`. The only addition is a new anti-pattern: "re-triggering Section 2 Step C after the user has already answered a clarifying question in this thread."
- **Section 4 — version & changelog lookup**, moved from `happyskills-help@0.3.3` Section 3 verbatim. Users need these mid-discovery to pick a version before installing; keeping them with search avoids a skill hand-off in the common "find then version-pick then install" flow.
- **Section 5 — install-on-recommendation for opt-in satellites**, moved from `happyskills-help@0.3.3` Section 6 verbatim. Currently only `happyskills-collab`.
- **Sections 6–7 — result presentation + constraints**, derived from `happyskills-help@0.3.3` Sections 8–9 with the search/discovery-specific subset kept and the family-overview/auth-only constraints dropped (those stay in help).
- **References — `discovery-protocol.md` and `version-history.md`** moved from help verbatim; **`smart-search.md`** moved with a surgical rewrite of the "When to Ask for Clarification" section to reflect the new hedging-rule design. The previous "prefer guessing over asking" default was what caused the failure mode this extraction exists to fix.

### Rationale
The `happyskills-help` skill had grown to 9 sections covering search, version lookup, family overview, feature routing, install-on-recommendation, auth, and result presentation — a Swiss Army knife where every patch release since 0.3.1 was about reshaping the discovery protocol. Extracting search into its own home gives the discovery surface room to evolve at its own cadence (a real conversational subsystem, project-aware framing, the hedging-rule + circuit-breaker design above) without dragging the stable concierge surface along. Help shrinks to a focused ~150-line concierge in `happyskills-help@0.4.0`.

### Notes
- This skill is bundled by default via `happyskillsai/happyskills@2.2.2` (the core skill's `dependencies` field). Users on `happyskills@2.2.1` or earlier will not have it auto-installed; an upgrade to core ≥ 2.2.2 pulls it in.
- No CLI change required. All commands (`search`, `postlex`, `versions`, `changelog`, `install`, `login`, `list`) work on `happyskills@0.49.0+` exactly as documented.
- The companion release `happyskills-help@0.4.0` strips the sections this skill now owns. The two releases must be published atomically so users do not land in a window where help has lost discovery before search exists in the registry — see the spec's execution sequence (§8) for the publish order.
