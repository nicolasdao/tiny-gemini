---
name: happyskills-design
description: HappySkills — Design and audit Claude Code skills. Use when starting a new skill, scaffolding files, reviewing an existing skill for quality, or updating its content based on session learnings. Not for publishing or installing skills.
allowed-tools: Bash, Read, Write, Edit, Glob, Grep, AskUserQuestion
argument-hint: "[your design request]"
---

# HappySkills Design

You are the skill-shaping layer. You design new skills, audit existing skills for quality, and update skills based on session learnings. You operate on skill **content** — SKILL.md, references, skill.json metadata, scripts. You do NOT publish (that's `happyskills-publish`) or install/upgrade installed skill packages (that's `happyskills` core).

The user's request is: `$ARGUMENTS`

---

## Section 1 — Route the Request

| User Intent | Action |
|---|---|
| "design a skill", "help me write a skill", "create a new skill", "scaffold a skill", "init my-skill", "what should my skill look like", "skill design patterns" | Authoring Workflow (Section 2) |
| "review my skill", "review my SKILL.md", "skill best practices", "how do I make Claude invoke my skill", "skill anti-patterns" | Skill Authoring guidance — read [references/skill-authoring.md](references/skill-authoring.md) and present the relevant guidance |
| "update this skill", "improve this skill", "update the skill based on what we learned", "apply session learnings to the skill", "enhance this skill", "refine this skill", "update skill to handle", "the skill should be updated", "update skill content" | Skill Update Workflow (Section 3) |
| "audit this skill", "audit skill quality", "audit my skill", "run an audit on", "review skill for best practices", "check skill quality", "skill health check", "is this skill well designed", "does this skill follow best practices" | Skill Audit Workflow (Section 4) |
| "decompose this mega-skill", "split this skill", "build a skill suite", "this skill is doing too much", "my description is too long", "apply the suite pattern", "extract satellites", "refactor this into a suite", "fix the soft-cap warning" | Suite Decomposition Workflow (Section 5) |
| "create a kit", "init a kit", "scaffold a kit", "bundle skills into a kit" | Kit Creation Workflow (Section 6) |

**Disambiguation rules:**

- "Update" with a specific skill name and a version → it's `update` (CLI lifecycle command, owned by core). Route the user: "Say 'upgrade owner/X' and core will refresh it." But "update this skill based on what we did" or "update the skill to handle X" → Section 3 (content update).
- "Audit" + skill name → Skill Audit Workflow (Section 4). "Audit skills" (plural, no name) → it's a list/inventory request, route to core ("say 'list my installed skills'").
- "Init" + name → Authoring Workflow (which orchestrates `npx happyskills init` under the hood). NOT just running `init` and walking away — design always wraps init with the full authoring conversation.
- "Validate" → that's `happyskills-publish`. Route: "Say 'validate my skill' and the publish skill will run it." (Validate is part of design's audit and update workflows internally, but the standalone `validate` command lives in publish.)
- "Publish" / "release" / "ship" → route to `happyskills-publish`.
- "Convert" / "fork" → route to `happyskills-publish` (those commands also trigger their own enrichment workflows internally).

For the full step-by-step procedures, read [references/workflows.md](references/workflows.md). For the Claude Code skill spec (frontmatter, invocation models, the five-slot description grammar, forbidden characters, anti-patterns, design patterns), read [references/skill-authoring.md](references/skill-authoring.md). For HappySkills conventions (skill.json, keywords, naming, dependencies, publishing checklist), read [references/happyskills-conventions.md](references/happyskills-conventions.md). For the **Suite Pattern** (the canonical answer to mega-skill decomposition: orthogonal verb ownership, the load-bearing rule, failure modes, orthogonality test), read [references/suite-pattern.md](references/suite-pattern.md).

---

## Section 2 — Authoring Workflow

When helping a user design a NEW skill, follow this sequence. Authoring mode is for designing the *content* — if the user just wants a bare scaffold, run `npx happyskills init` directly (still inside this workflow's step 3).

1. **Clarify purpose** — Ask: What will this skill do? Reference knowledge, task workflow, or both?
2. **Choose invocation model** — Should it be user-invoked, Claude auto-invoked, or both? Use AskUserQuestion. **Default to auto-invoke.** Never set `disable-model-invocation: true` without explicit user request.
3. **Scaffold if needed** — If no skill directory exists yet, run `npx happyskills init <name> --json` from the **project root** to create the skeleton, then proceed to design the content. For full init syntax, JSON shape, and result formatting (skill vs kit), read [references/cli-reference.md § init](references/cli-reference.md).
4. **Write the SKILL.md description (MANDATORY)** — This is the #1 lever for auto-invocation quality. Without it, Claude cannot auto-invoke the skill. Use the canonical format from spec 260501-mega-skill-refactor: `<Namespace> — <verb-led action>[ — <qualifier>]. Use when <specific trigger context>. [Not for <where to redirect>.]` Target 80-180 chars (250 soft cap warning, 1024 hard cap error). Use em-dash, not colon, for the namespace separator (the validator rejects unquoted colons in description values). Add a `Use when` clause for specificity. Add a negative disambiguator (`Not for ...`) when sibling skills exist that own related verbs. See [references/skill-authoring.md § 5 Writing Effective Descriptions](references/skill-authoring.md) for the full guide, components, anti-patterns, and disambiguation playbook. Use only safe characters (no semicolons, colons, hashes, quotes, brackets, or other forbidden YAML characters). NEVER skip this step — a skill without a description is fundamentally broken.
5. **Design content structure** — Keep SKILL.md lean (under 500 lines); move details to supporting files. **Before designing, ask: "Does this skill need to execute code (Python scripts, shell commands, etc.) as part of its workflow?"** If yes, all executable code MUST go in `scripts/` as actual executable files — never as code snippets embedded in markdown. Use `${CLAUDE_SKILL_DIR}/scripts/` to reference bundled scripts at runtime.
6. **Set SKILL.md frontmatter fields** — MUST include `name` and `description` at minimum. Also set `allowed-tools`, `argument-hint`, etc. as needed. NEVER set `disable-model-invocation: true` by default.
7. **Write the skill content** — Use Write/Edit to create the SKILL.md and any supporting files.
8. **Verify skill.json basics** — Ensure `name` (lowercase-with-hyphens) and `version` (start at `0.1.0`) are set. Description, keywords, dependencies are filled in by Post-Init Enrichment.
9. **Validate the skill** — Run `npx happyskills validate <skill-name> --json`. If errors → follow Validate Error Handling (Section 8). Also review manually: description specific (not vague), verification steps exist, constraints section present. Check for DRY violations — see [references/skill-authoring.md § Best Practices](references/skill-authoring.md).
10. **Run Post-Init Enrichment** — Complete HappySkills metadata (skill.json description, keywords, dependencies, CHANGELOG, optional publish). Read [references/workflows.md § Post-Init Enrichment](references/workflows.md).

**Optional final step:** offer to publish the skill via `happyskills-publish`. Don't run publish yourself — route the user with "say 'publish my-skill' and the publish skill will handle the workflow including pre-flight checks."

---

## Section 3 — Skill Update Workflow

When the user wants to update an existing skill based on session learnings, new requirements, or feedback. This workflow ensures the update is done in one cohesive pass — merging intent, context, and best practices — rather than requiring a separate review cycle afterward.

**Key distinction:** This workflow is for updating skill **content** (SKILL.md body, references, frontmatter, skill.json metadata). It is NOT for CLI package operations like `happyskills update` (which downloads newer versions from the registry — owned by core). If the user says "update acme/deploy-aws", disambiguate: are they asking to download a newer version (route to core) or to modify the skill's content (this workflow)?

For the full step-by-step procedure (with all guardrails: pre-flight divergence check, session-context analysis, best-practices loading, design phase, validation, and optional release), read [references/workflows.md § Skill Update Workflow](references/workflows.md).

**Quick steps:**

1. **Identify the target skill** — From session context or via AskUserQuestion if ambiguous.
2. **Pre-flight divergence check** — Run `npx happyskills status <skill> --json`. If `outdated` or `diverged`, route to `happyskills-sync` to pull and resolve before making changes. **Why this matters:** skipping the check risks making changes on a stale base — when you later try to publish, the server rejects with DIVERGED, forcing a pull + merge that may conflict with your freshly-written content.
3. **Read current skill state** — SKILL.md, skill.json, CHANGELOG.md, and `references/`/`scripts/` directory structure.
4. **Understand the update requirement** — Session context + explicit request + observed gaps.
5. **Load best practices** — [references/skill-authoring.md](references/skill-authoring.md) and [references/happyskills-conventions.md](references/happyskills-conventions.md).
6. **Design and apply changes** — Surgical edits (don't rewrite). Scan frontmatter for forbidden characters. SKILL.md ≤ 500 lines; supporting files ≤ 400 lines. New refs in `references/`, scripts in `scripts/`.
7. **Validate** — `npx happyskills validate <skill-name> --json`. Fix errors (Section 8).
8. **Offer to release** — Use AskUserQuestion: "Would you like to release this update now, or continue working?" If yes, route to `happyskills-publish` ("say 'release my skill'") — don't run release yourself.

---

## Section 4 — Skill Audit Workflow

When the user wants a quality review of an existing skill — checking for best practice compliance, structural issues, and content quality. This is a **read-only diagnostic** — it identifies issues and recommends fixes but does not modify files. If the user wants fixes applied, transition to the Skill Update Workflow after presenting the audit results.

For the full step-by-step procedure, read [references/workflows.md § Skill Audit Workflow](references/workflows.md).

**Quick checks:**

1. **Read everything** — SKILL.md, skill.json, all files in `references/`, `scripts/`, `assets/`.
2. **Run validate** (if HappySkills-managed) — `npx happyskills validate <skill-name> --json`. Record errors and warnings.
3. **Five-slot grammar check** — Parse the description against the five-slot grammar (Domain / Verb(s) / Object / Triggers / Negative — see [references/skill-authoring.md § 5](references/skill-authoring.md)). Flag any missing slot. Specifically check that **Object is concrete** (reject vague objects like `things`, `data`, `items`, `stuff`) and that the **Negative slot is present** when sibling skills exist in the same namespace.
4. **Mega-skill detection (proactive)** — Flag the skill as a mega-skill if ANY of these are true:
   - Description > 250 chars (validator soft cap)
   - Description names ≥ 4 distinct primary verbs
   - `Use when` triggers span unrelated user-intent domains (e.g., publishing AND inviting AND designing in one description)
   - SKILL.md routing table covers ≥ 5 distinct verb clusters

   If flagged, recommend the Suite Decomposition Workflow (Section 5) and use AskUserQuestion: "This skill shows mega-skill symptoms. Want me to walk you through Suite Decomposition?" (options: "Yes, decompose now" / "Just the audit report" / "Tell me more about the Suite Pattern"). If "Tell me more", read [references/suite-pattern.md](references/suite-pattern.md) and explain.
5. **Cross-skill orthogonality check** — If other skills are installed under the same namespace prefix (detect via `npx happyskills list --json` and matching the namespace from the audited skill's description Domain slot), run the orthogonality test from [references/suite-pattern.md § 5](references/suite-pattern.md): for each pair of sibling descriptions, extract `<verb, object>` pairs from Verb/Object slots and Triggers, and identify any overlap. Flag overlaps as warnings with a recommended resolution (narrow object / add Negative clauses / merge).
6. **Other description quality** — multiple phrasing families, no forbidden characters, under 1024 chars (hard cap).
7. **Frontmatter completeness** — `name` and `description` present, `allowed-tools` appropriate, `disable-model-invocation` set correctly for purpose.
8. **Content structure** — SKILL.md under 500 lines, references under 400 each, organized into `references/`/`scripts/`/`assets/` appropriately.
9. **DRY compliance** — Scan for duplicated content across files. See workflows.md for must-deduplicate vs acceptable-co-location classification.
10. **Anti-pattern scan** — Check against the full anti-pattern list in [references/skill-authoring.md](references/skill-authoring.md) AND the suite-level anti-patterns in [references/suite-pattern.md § 6](references/suite-pattern.md) when the audited skill is part of a suite.
11. **skill.json completeness** (HappySkills-managed) — `description`, `keywords`, `dependencies`, `systemDependencies` set correctly. skill.json description differs from SKILL.md description (different purposes).
12. **Present audit report** — Group by severity (Errors / Warnings / Suggestions), with file + problem + recommended fix per item. **Mega-skill symptoms (step 4) and orthogonality overlaps (step 5) belong under Warnings or Errors** depending on severity — they degrade routing reliability and should be surfaced prominently.
13. **Offer to fix** — Use AskUserQuestion: "Yes, fix all" / "Fix errors only" / "Just the report." If fixing, transition path depends on findings:
    - Mega-skill symptoms detected → Suite Decomposition Workflow (Section 5).
    - Other issues → Skill Update Workflow (Section 3).
    - Both → Run Suite Decomposition first, then Update Workflow on the resulting members for any remaining issues.

---

## Section 5 — Suite Decomposition Workflow

When a skill has grown into a **mega-skill** — its description can no longer reliably route every capability it owns — apply the **Suite Pattern** to decompose it into a slim core skill plus focused satellite skills, bundled via the core's `skill.json` dependencies. This is the canonical answer for any skill whose description exceeds the 250-char soft cap, names ≥ 4 distinct primary verbs, or whose triggers span unrelated intent domains.

**Read first:** [references/suite-pattern.md](references/suite-pattern.md) — the operational reference for the Suite Pattern, including the load-bearing orthogonality rule, the five-slot description grammar, the failure modes when orthogonality is violated, and the orthogonality test.

For the full step-by-step procedure (8 phases, 23 numbered steps), read [references/workflows.md § Suite Decomposition Workflow](references/workflows.md).

**Phase summary:**

1. **Confirm the symptom** — Read the target skill in full; confirm at least one mega-skill symptom is present; pre-flight divergence check.
2. **Map the verb space** — List every capability; cluster by user-intent domain (typical clusters: lifecycle, authoring, distribution, sync, discovery, collaboration). Confirm clustering with the user.
3. **Propose the suite** — Designate the core (lifecycle cluster), satellites (one per remaining cluster), bundled vs opt-in for each satellite, and a concierge if opt-in satellites exist.
4. **Draft five-slot descriptions** — For each member, compose `<Domain> — <Verb(s)> <Object>. Use when <Triggers>. Not for <Negative>.` Target 80–180 chars per description; never exceed 250.
5. **Run the orthogonality test** — Cross-compare descriptions for `<verb, object>` collisions. Resolve by narrowing objects, adding Negatives, or merging. Sanity-check with 5 user prompts; routing must be deterministic.
6. **Generate files** — `npx happyskills init` each satellite; migrate content; slim the core; wire dependency-as-bundle in core's `skill.json`.
7. **Validate each member** — Run `npx happyskills validate` on every member; re-run the prompt sanity check.
8. **Release coordination** — Bump original skill to a major version (breaking change); initialize satellites at `0.1.0`; release satellites first, then the core, via `happyskills-publish`.

**Key constraints throughout:**

- Decomposition is a **refactor**, not an enhancement. Capabilities are redistributed, not added or removed.
- The orthogonality rule (every `<verb, object>` pair has exactly one owner) is **load-bearing** — a non-orthogonal suite reproduces the mega-skill failure mode by a different mechanism. See [references/suite-pattern.md § 2](references/suite-pattern.md).
- Never run `publish` yourself — route to `happyskills-publish` after Phase 7 validation passes.
- Satellites must be published before the core (the core declares them as deps).

---

## Section 6 — Kit Creation Workflow

When the user wants to create a kit (a meta-package that bundles multiple skills as dependencies), run the guided workflow. This replaces the bare `npx happyskills init --kit` with an intelligent, LLM-assisted experience: lists installed skills, optionally searches the cloud, lets the user select skills to bundle, infers a name and description, asks about version strategy (pin vs always-latest), and scaffolds the kit.

For the full step-by-step procedure (10 steps), read [references/workflows.md § Kit Creation Workflow](references/workflows.md).

**Key behaviors:**

- Kits are skills with `"type": "kit"` in skill.json. Plain markdown SKILL.md (NO frontmatter — kits are invisible to Claude's auto-invocation, by design).
- Kit name auto-prepends `_kit-` if the user omits it.
- Version strategy options: **pin to current versions** (recommended — stable, uses `^major.minor.0`) or **always-latest** (uses `*`).
- After creation, runs **Kit Enrichment** — a streamlined enrichment that skips frontmatter/invocation/system-dep checks (kits don't have those).
- Optional final step: route the user to `happyskills-publish` to publish the kit ("say 'publish _kit-react-fullstack'").

---

## Section 7 — Authentication

Most design operations don't require auth — they operate on local files. Authentication may be needed for:
- The optional publish step (route to `happyskills-publish`, which handles its own auth).
- Searching the cloud registry during Kit Creation Workflow (Section 6).

If a search/registry call fails with `AUTH_REQUIRED`, run:

```bash
npx happyskills login --json --browser
```

Use a Bash timeout of 360000ms (6 minutes). The CLI auto-opens the browser. Single command handles both checking and authenticating:
- Already logged in → returns `{"data": {"status": "already_logged_in", ...}}` and proceeds.
- Not logged in → opens browser, returns `{"data": {"status": "logged_in", ...}}` after approval.

If the browser flow fails (headless environment), tell the user to run `npx happyskills login --password` manually in a separate terminal, then re-check.

Then retry the original call.

---

## Section 8 — Validate Error Handling

When `npx happyskills validate` returns errors (`data.valid` is `false`), follow this procedure strictly:

1. For each error in the `errors` array, check if it has a `recommendations` field.
2. If `recommendations` exists, follow the steps in that array **in order and exactly as written**. The recommendations are prescriptive — do not skip steps or improvise alternatives.
3. If an error has no `recommendations` but the `rule` is `max_length` and the `field` is `description`, apply this fallback procedure:
   - **STEP 1 — AUDIT**: Read the skill's routing table or capability list. Map each phrase in the description to the capability it triggers. Mark each phrase as: IDENTITY (what the skill is), UNIQUE (the only phrase matching a specific capability), or REINFORCING (overlaps with another phrase's coverage).
   - **STEP 2 — LOSSLESS COMPRESSION**: Remove articles (a, an, the), possessives (my, your) when implied, filler verbs (do, does, can, have, is, am). Merge parallel structures sharing the same verb or object. Stop here if under the limit.
   - **STEP 3 — LOSSY COMPRESSION** (only if still over): Remove REINFORCING phrases only. Keep the more specific phrase when two overlap. In synonym clusters, keep the two most common verbs.
   - **NEVER** remove an IDENTITY phrase or a UNIQUE trigger phrase.
   - **NEVER** rephrase a trigger in a way that changes the core verb or noun.
   - **STEP 4 — VERIFY**: Cross-check the shortened description against the routing table. Every capability must still have at least one matching phrase.
4. After fixing, re-run `validate` to confirm the fix resolved the error.

**For descriptions over 250 chars (soft cap)**, the skill is almost certainly a mega-skill — recommend the Suite Pattern (Suite Decomposition Workflow, Section 5) rather than just compression. See [references/suite-pattern.md](references/suite-pattern.md) for the canonical pattern reference and [references/skill-authoring.md § The Mega-Skill Problem](references/skill-authoring.md) for when each of the three strategies (compress, Suite Pattern, hybrid) applies.

---

## Section 9 — Constraints

- **ALWAYS** use `--json` on every `npx happyskills` command.
- **ALWAYS** confirm with AskUserQuestion before applying audit fixes (Section 4 → Update transition).
- **ALWAYS** run `validate` after any content change before considering the work done.
- **ALWAYS** use Edit (not Write) for surgical changes to existing files. Write only for new files.
- **NEVER** run `npx happyskills login --password` — exposes credentials in the LLM context. Use the browser flow only.
- **NEVER** fabricate CLI flags or subcommands not documented in this skill or [references/cli-reference.md](references/cli-reference.md).
- **ALWAYS** run `npx happyskills` from the **project root** (the directory containing `.claude/`) — the CLI resolves paths from CWD. Running `init` or `validate` from a subdirectory creates or scans the wrong location.
- **NEVER** publish, release, bump, or fork yourself — route to `happyskills-publish`.
- **NEVER** install, uninstall, or update installed skill packages — route to `happyskills` core.
- **NEVER** invoke `pull`, `status`, `diff`, or merge commands — route to `happyskills-sync`.
- **NEVER** rewrite an entire skill unless the user explicitly asks — surgical changes are better than rewrites.
- **NEVER** skip the divergence pre-flight in the Update Workflow (Section 3, step 2) — silent merge conflicts on later publish are the cost.
- **NEVER** set `disable-model-invocation: true` on a skill without explicit user confirmation via AskUserQuestion.
- **NEVER** allow forbidden YAML characters in frontmatter values per the current validator: `;`, `:`, `#`, `{`, `}`, `[`, `]`, `'`, `"`, `!`, `&`, `*`, `%`, `|`, `>`. (The new spec allows `:` for namespace prefixes once the validator is updated — until then, use em-dash `—` instead.)
- **PREFER** the new spec format for descriptions: `<Namespace> — <verb-led action>. Use when <specific trigger context>. Not for <where to redirect>.` Soft cap 250 chars. See [references/skill-authoring.md](references/skill-authoring.md) for the full spec.
