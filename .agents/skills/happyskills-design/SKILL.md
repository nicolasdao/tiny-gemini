---
name: happyskills-design
description: HappySkills — Design, audit, and update skills and kits. Use when starting a skill, scaffolding, reviewing quality, decomposing a mega-skill, applying session learnings, or editing a kit. Not for publishing, installing, or upgrading skills.
allowed-tools: Bash, Read, Write, Edit, Glob, Grep, AskUserQuestion
argument-hint: "[your design request]"
---

# HappySkills Design

You are the skill-shaping layer. You design new skills, audit existing skills for quality, and update skills based on session learnings. You operate on skill **content** — SKILL.md, references, skill.json metadata, scripts. You do NOT publish (that's `happyskills-publish`) or install/upgrade installed skill packages (that's `happyskills` core).

The user's request is: `$ARGUMENTS`

---

## STOP — pre-flight for NEW skills (mandatory, no exceptions)

If the user's request is to design, create, scaffold, or init a NEW skill (Authoring Workflow), you MUST run `npx happyskills init <name> --json` from the project root **before writing any file**. No exceptions.

- Do NOT manually create a skill directory.
- Do NOT manually author `skill.json`.
- Do NOT skip `init` because the project keeps skills in a non-default location (`.agents/skills/`, `.cursor/skills/`, etc.). Run `init` in the canonical `.claude/skills/` location first; relocate the result afterward if needed.
- Do NOT decide "this is a special case." It isn't. Skipping `init` produces a non-managed skill that cannot be validated, listed, published, or synced.

If `init` fails, STOP and report the failure to the user. Do NOT fall back to manual scaffolding.

This pre-flight only applies to NEW skills. For updates, audits, and decomposition of existing skills, proceed to the relevant section.

---

## Section 1 — Route the Request

| User Intent | Action |
|---|---|
| "design a skill", "help me write a skill", "create a new skill", "scaffold a skill", "init my-skill", "what should my skill look like", "skill design patterns" | Authoring Workflow (Section 2) |
| "review my skill", "review my SKILL.md", "skill best practices", "how do I make Claude invoke my skill", "skill anti-patterns" | Skill Authoring guidance — read [references/skill-authoring.md](references/skill-authoring.md) and present the relevant guidance |
| "update this skill", "improve this skill", "update the skill based on what we learned", "apply session learnings to the skill", "enhance this skill", "refine this skill", "update skill to handle", "the skill should be updated", "update skill content" | Skill Update Workflow (Section 3) |
| "audit this skill", "audit skill quality", "audit my skill", "run an audit on", "review skill for best practices", "check skill quality", "skill health check", "is this skill well designed", "does this skill follow best practices" | Skill Audit Workflow (Section 4) |
| "decompose this mega-skill", "split this skill", "build a skill constellation", "this skill is doing too much", "my description is too long", "apply the constellation pattern", "extract satellites", "refactor this into a constellation", "fix the soft-cap warning" | Constellation Decomposition Workflow (Section 5) |
| "create a kit", "init a kit", "scaffold a kit", "bundle skills into a kit" | Kit Workflows — Create (Section 6) |
| "add a skill to my kit", "remove a skill from my kit", "edit my kit", "change what my kit bundles", "update my kit's contents", "swap a skill in my kit" | Kit Workflows — Update (Section 6) |

**Disambiguation rules:**

- "Update" with a specific skill name and a version → it's `update` (CLI lifecycle command, owned by core). Route the user: "Say 'upgrade owner/X' and core will refresh it." But "update this skill based on what we did" or "update the skill to handle X" → Section 3 (content update).
- "Update my kit" is ambiguous — resolve it by what changes. Changing *what the kit bundles* (add/remove member skills, change version ranges) is **content authoring** → Kit Update Workflow (Section 6). But *upgrading the installed kit to newer published versions* ("upgrade my kit", "get the latest for my kit") is **lifecycle**, owned by core → route the user: "Say 'upgrade owner/_kit-X' and core will refresh it." And "publish my kit" → route to `happyskills-publish`.
- "Audit" + skill name → Skill Audit Workflow (Section 4). "Audit skills" (plural, no name) → it's a list/inventory request, route to core ("say 'list my installed skills'").
- "Init" + name → Authoring Workflow (which orchestrates `npx happyskills init` under the hood). NOT just running `init` and walking away — design always wraps init with the full authoring conversation.
- "Validate" → that's `happyskills-publish`. Route: "Say 'validate my skill' and the publish skill will run it." (Validate is part of design's audit and update workflows internally, but the standalone `validate` command lives in publish.)
- "Publish" / "release" / "ship" → route to `happyskills-publish`.
- "Convert" / "fork" → route to `happyskills-publish` (those commands also trigger their own enrichment workflows internally).

For the full step-by-step procedures, read [references/workflows.md](references/workflows.md). For the Claude Code skill spec (frontmatter, invocation models, the five-slot description grammar, forbidden characters, anti-patterns, design patterns), read [references/skill-authoring.md](references/skill-authoring.md). For HappySkills conventions (skill.json, keywords, naming, dependencies, publishing checklist), read [references/happyskills-conventions.md](references/happyskills-conventions.md). For the **Constellation Pattern** (the canonical answer to mega-skill decomposition: orthogonal verb ownership, the load-bearing rule, failure modes, orthogonality test), read [references/constellation-pattern.md](references/constellation-pattern.md).

---

## Section 2 — Authoring Workflow

When helping a user design a NEW skill, follow this sequence. Authoring mode is for designing the *content* — if the user just wants a bare scaffold, run `npx happyskills init` directly (still inside this workflow's step 3).

1. **Clarify purpose** — Ask: What will this skill do? Reference knowledge, task workflow, or both?
2. **Choose invocation model** — Should it be user-invoked, Claude auto-invoked, or both? Use AskUserQuestion. **Default to auto-invoke.** Never set `disable-model-invocation: true` without explicit user request.
3. **Scaffold if needed** — If no skill directory exists yet, run `npx happyskills init <name> --json` from the **project root** to create the skeleton, then proceed to design the content. For full init syntax, JSON shape, and result formatting (skill vs kit), read [references/cli-reference.md § init](references/cli-reference.md).
4. **Write the SKILL.md description (MANDATORY)** — This is the #1 lever for auto-invocation quality. Without it, Claude cannot auto-invoke the skill. Use the canonical format from spec 260501-mega-skill-refactor: `<Namespace> — <verb-led action>[ — <qualifier>]. Use when <specific trigger context>. [Not for <where to redirect>.]` Target 80-180 chars (250 soft cap warning, 1024 hard cap error). Use em-dash, not colon, for the namespace separator (the validator rejects unquoted colons in description values). Add a `Use when` clause for specificity. Add a negative disambiguator (`Not for ...`) when sibling skills exist that own related verbs. See [references/skill-authoring.md § 5 Writing Effective Descriptions](references/skill-authoring.md) for the full guide, components, anti-patterns, and disambiguation playbook. Use only safe characters (no semicolons, colons, hashes, quotes, brackets, or other forbidden YAML characters). NEVER skip this step — a skill without a description is fundamentally broken.
5. **Design content structure** — Keep SKILL.md lean (under 500 lines); move details to supporting files. **Before designing, ask: "Does this skill need to execute code (Python scripts, shell commands, etc.) as part of its workflow?"** If yes, all executable code MUST go in `scripts/` as actual executable files — never as code snippets embedded in markdown. Use `${CLAUDE_SKILL_DIR}/scripts/` to reference bundled scripts at runtime. Likewise ask whether the skill needs **per-user setup** (a channel, an ID, an account) — if so, persist it with the config.json setup pattern (read on start, ask once via AskUserQuestion, reuse), see [references/skill-authoring.md § 11 Pattern 6](references/skill-authoring.md).
6. **Set SKILL.md frontmatter fields** — MUST include `name` and `description` at minimum. Also set `allowed-tools`, `argument-hint`, etc. as needed. NEVER set `disable-model-invocation: true` by default.
7. **Write the skill content** — Use Write/Edit to create the SKILL.md and any supporting files.
8. **Verify skill.json basics** — Ensure `name` (lowercase-with-hyphens) and `version` (start at `0.1.0`) are set. Description and dependencies are filled in by Post-Init Enrichment.
9. **Validate the skill** — Run `npx happyskills validate <skill-name> --json`. If errors → follow Validate Error Handling (Section 8). Also review manually: description specific (not vague), verification steps exist, constraints section present. Check for DRY violations — see [references/skill-authoring.md § Best Practices](references/skill-authoring.md).
10. **Run Post-Init Enrichment** — Complete HappySkills metadata (skill.json description, dependencies, **authors, license, repository**, CHANGELOG, optional publish). The authors/license/repository prompts are MANDATORY — three separate AskUserQuestion calls, do NOT skip, do NOT pick defaults on the user's behalf. Read [references/workflows.md § Post-Init Enrichment](references/workflows.md).

**Optional final step:** offer to publish the skill via `happyskills-publish`. Don't run publish yourself — route the user with "say 'publish my-skill' and the publish skill will handle the workflow." A freshly-scaffolded skill at this point is a **draft** (per `happyskills@0.51.0+`: it shows up under `data.drafts[]` in `npx happyskills list --json`, not `data.external[]`); `happyskills-publish` ships it via the atomic `release` primitive in a single step — no separate `convert` or "claim workspace" detour. Do NOT tell the user their skill is "external" or that it needs to be "converted" — it isn't, and it doesn't.

---

## Section 3 — Skill Update Workflow

When the user wants to update an existing skill based on session learnings, new requirements, or feedback. This workflow ensures the update is done in one cohesive pass — merging intent, context, and best practices — rather than requiring a separate review cycle afterward.

**Key distinction:** This workflow is for updating skill **content** (SKILL.md body, references, frontmatter, skill.json metadata). It is NOT for CLI package operations like `happyskills update` (which downloads newer versions from the registry — owned by core). If the user says "update acme/deploy-aws", disambiguate: are they asking to download a newer version (route to core) or to modify the skill's content (this workflow)?

For the full step-by-step procedure (with all guardrails: pre-flight divergence check, session-context analysis, best-practices loading, design phase, validation, and optional release), read [references/workflows.md § Skill Update Workflow](references/workflows.md).

**Quick steps:**

1. **Identify the target skill** — From session context or via AskUserQuestion if ambiguous.
2. **Pre-flight divergence check** — Run `npx happyskills status <skill> --json`. Route by status:
   - `outdated`, `diverged`, or `conflicts` → route to `happyskills-sync` to pull and resolve before making changes. **Why this matters:** skipping the check risks making changes on a stale base — when you later try to publish, the server rejects with DIVERGED, forcing a pull + merge that may conflict with your freshly-written content.
   - `drift` → **BLOCK editing.** The lock file and on-disk `skill.json` disagree about which version is installed — the baseline you'd be editing on top of is incoherent. Narrate in plain English ("The skill on disk doesn't match what was installed — lock says version X, the on-disk skill.json says Y") and route to `happyskills-sync` Section 2.5 (Drift Repair): "Say 'fix the drift on X' and sync will guide you through repair." Do not proceed with edits — modifying a drifted skill bakes more changes onto an already-broken baseline and makes the eventual repair harder.
   - `not_found` → the skill has no lock entry — it's a **draft** (scaffolded by `init`, never published). `status` reads only the lock file, so this is expected, not an error; there's no remote baseline to diverge from. Proceed with edits.
   - `clean`, `modified`, or `ahead` → proceed.
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

   If flagged, recommend the Constellation Decomposition Workflow (Section 5) and use AskUserQuestion: "This skill shows mega-skill symptoms. Want me to walk you through Constellation Decomposition?" (options: "Yes, decompose now" / "Just the audit report" / "Tell me more about the Constellation Pattern"). If "Tell me more", read [references/constellation-pattern.md](references/constellation-pattern.md) and explain.
5. **Cross-skill orthogonality check** — If other skills are installed under the same namespace prefix (detect via `npx happyskills list --json` and matching the namespace from the audited skill's description Domain slot), run the orthogonality test from [references/constellation-pattern.md § 5](references/constellation-pattern.md): for each pair of sibling descriptions, extract `<verb, object>` pairs from Verb/Object slots and Triggers, and identify any overlap. Flag overlaps as warnings with a recommended resolution (narrow object / add Negative clauses / merge).
6. **Other description quality** — multiple phrasing families, no forbidden characters, under 1024 chars (hard cap).
7. **Frontmatter completeness** — `name` and `description` present, `allowed-tools` appropriate, `disable-model-invocation` set correctly for purpose.
8. **Content structure** — SKILL.md under 500 lines, references under 400 each, organized into `references/`/`scripts/`/`assets/` appropriately.
9. **DRY compliance** — Scan for duplicated content across files. See workflows.md for must-deduplicate vs acceptable-co-location classification.
10. **Anti-pattern scan** — Check against the full anti-pattern list in [references/skill-authoring.md](references/skill-authoring.md) AND the constellation-level anti-patterns in [references/constellation-pattern.md § 6](references/constellation-pattern.md) when the audited skill is part of a constellation.
11. **skill.json completeness** (HappySkills-managed) — `description`, `dependencies`, `systemDependencies` set correctly. skill.json description differs from SKILL.md description (different purposes).
12. **Present audit report** — Group by severity (Errors / Warnings / Suggestions), with file + problem + recommended fix per item. **Mega-skill symptoms (step 4) and orthogonality overlaps (step 5) belong under Warnings or Errors** depending on severity — they degrade routing reliability and should be surfaced prominently.
13. **Offer to fix** — Use AskUserQuestion: "Yes, fix all" / "Fix errors only" / "Just the report." If fixing, transition path depends on findings:
    - Mega-skill symptoms detected → Constellation Decomposition Workflow (Section 5).
    - Other issues → Skill Update Workflow (Section 3).
    - Both → Run Constellation Decomposition first, then Update Workflow on the resulting members for any remaining issues.

---

## Section 5 — Constellation Decomposition Workflow

When a skill has grown into a **mega-skill** — its description can no longer reliably route every capability it owns — apply the **Constellation Pattern** to decompose it into a slim core skill plus focused satellite skills, bundled via the core's `skill.json` dependencies. This is the canonical answer for any skill whose description exceeds the 250-char soft cap, names ≥ 4 distinct primary verbs, or whose triggers span unrelated intent domains.

**Read first:** [references/constellation-pattern.md](references/constellation-pattern.md) — the operational reference for the Constellation Pattern, including the load-bearing orthogonality rule, the five-slot description grammar, the failure modes when orthogonality is violated, and the orthogonality test.

For the full step-by-step procedure (8 phases, 23 numbered steps), read [references/workflows.md § Constellation Decomposition Workflow](references/workflows.md).

**Phase summary:**

1. **Confirm the symptom** — Read the target skill in full; confirm at least one mega-skill symptom is present; pre-flight divergence check.
2. **Map the verb space** — List every capability; cluster by user-intent domain (typical clusters: lifecycle, authoring, distribution, sync, discovery, collaboration). Confirm clustering with the user.
3. **Propose the constellation** — Designate the core (lifecycle cluster), satellites (one per remaining cluster), bundled vs opt-in for each satellite, and a concierge if opt-in satellites exist.
4. **Draft five-slot descriptions** — For each member, compose `<Domain> — <Verb(s)> <Object>. Use when <Triggers>. Not for <Negative>.` Target 80–180 chars per description; never exceed 250.
5. **Run the orthogonality test** — Cross-compare descriptions for `<verb, object>` collisions. Resolve by narrowing objects, adding Negatives, or merging. Sanity-check with 5 user prompts; routing must be deterministic.
6. **Generate files** — `npx happyskills init` each satellite; migrate content; slim the core; wire dependency-as-bundle in core's `skill.json`.
7. **Validate each member** — Run `npx happyskills validate` on every member; re-run the prompt sanity check.
8. **Release coordination** — Bump original skill to a major version (breaking change); initialize satellites at `0.1.0`; release satellites first, then the core, via `happyskills-publish`.

**Key constraints throughout:**

- Decomposition is a **refactor**, not an enhancement. Capabilities are redistributed, not added or removed.
- The orthogonality rule (every `<verb, object>` pair has exactly one owner) is **load-bearing** — a non-orthogonal constellation reproduces the mega-skill failure mode by a different mechanism. See [references/constellation-pattern.md § 2](references/constellation-pattern.md).
- Never run `publish` yourself — route to `happyskills-publish` after Phase 7 validation passes.
- Satellites must be published before the core (the core declares them as deps).

---

## Section 6 — Kit Workflows (Create and Update)

A kit is a meta-package whose content **is** its `dependencies` list — the skills it bundles. Editing a kit is therefore skill-content authoring, which is why both creating and updating a kit live here in design, not in core (which only installs/upgrades the kit as a package) or publish (which only ships it).

### 6a — Create a kit

When the user wants to create a kit (a meta-package that bundles multiple skills as dependencies), run the guided workflow. This replaces the bare `npx happyskills init --kit` with an intelligent, LLM-assisted experience: lists installed skills, optionally searches the cloud, lets the user select skills to bundle, infers a name and description, asks about version strategy (pin vs always-latest), and scaffolds the kit.

For the full step-by-step procedure (10 steps), read [references/workflows.md § Kit Creation Workflow](references/workflows.md).

**Key behaviors:**

- Kits are skills with `"type": "kit"` in skill.json. They ship a plain `README.md` (NOT `SKILL.md`) — the absence of `SKILL.md` is what keeps kits invisible to every agent runtime (Claude Code, Codex, Gemini, etc.).
- Kit name auto-prepends `_kit-` if the user omits it.
- Version strategy options: **pin to current versions** (recommended — stable, uses `^major.minor.0`) or **always-latest** (uses `*`).
- After creation, runs **Kit Enrichment** — a streamlined enrichment that skips frontmatter/invocation/system-dep checks (kits don't have those).
- Optional final step: route the user to `happyskills-publish` to publish the kit ("say 'publish _kit-react-fullstack'").

### 6b — Update a kit

When the user wants to change what an existing kit bundles — add a member skill, remove one, swap one out, or change a version range — run the guided update workflow. The kit's content **is** its `dependencies` map, so this is a surgical `skill.json` edit, not a re-scaffold.

For the full step-by-step procedure, read [references/workflows.md § Kit Update Workflow](references/workflows.md).

**Key behaviors:**

- **Disambiguate first (MANDATORY).** "Update my kit" has three meanings — confirm which via AskUserQuestion before touching anything: (1) *change what it bundles* → this workflow; (2) *upgrade the installed kit to newer published versions* → route to core ("say 'upgrade owner/_kit-X'"); (3) *publish the kit* → route to `happyskills-publish`. Never assume meaning (1).
- **Identify the kit deterministically.** Run `npx happyskills list --json`. A kit is the `_kit-`-prefixed entry (the prefix is enforced by the CLI); managed (`data.skills`) and draft (`data.drafts`) entries also carry `type: "kit"`. **Note which bucket it's in** — `data.skills` (managed, lock-tracked) vs `data.drafts` (created locally, never published) — the pre-flight below branches on it. If more than one kit exists, ask which one via AskUserQuestion — never guess.
- **Pre-flight divergence check (managed kits only).** A kit created locally but never published is a **draft** (Step-1 bucket `data.drafts`, no lock entry) — it has no remote baseline, so `npx happyskills status` returns `not_found`; **skip the check and edit directly.** For a **managed** kit (`data.skills`), run `npx happyskills status <kit-name> --json`: `outdated`/`diverged`/`conflicts` → route to `happyskills-sync` first; `drift` → BLOCK and route to sync's Drift Repair; `clean`/`modified`/`ahead` → proceed.
- **Edit the dependency map, nothing else.** Add/remove/replace entries in `skill.json` `dependencies`, or adjust a version range. Use Edit (surgical), never a rewrite. Apply the same version-strategy logic as creation: pin → `^major.minor.0`, always-latest → `*`. For a newly added member, resolve its current version via `list` (if installed) or `npx happyskills search "<owner/name>" --json --limit 10` (if from the registry — `--limit` is required).
- **Keep the README in sync.** Update the kit's `README.md` "What's Included" list to match the new dependency set (kits ship `README.md`, never `SKILL.md`).
- **Validate, then route to publish.** Run `npx happyskills validate <kit-name> --json`, fix any errors, then offer to publish via `happyskills-publish` ("say 'publish <kit-name>'"). Do NOT run publish yourself.

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

When `npx happyskills validate` fails, the envelope returns `ok === false` with `error.code === 'VALIDATION_FAILED'` and `next_step.action === 'fix_validation_errors'`. The per-rule failures live under `error.validation_errors[]` (and `data.errors[]` for backward compatibility — both arrays carry identical content). Follow this procedure strictly:

1. For each error in `error.validation_errors[]` (or `data.errors[]`), check if it has a `recommendations` field.
2. If `recommendations` exists, follow the steps in that array **in order and exactly as written**. The recommendations are prescriptive — do not skip steps or improvise alternatives.
3. If an error has no `recommendations` but the `rule` is `max_length` and the `field` is `description`, apply this fallback procedure:
   - **STEP 1 — AUDIT**: Read the skill's routing table or capability list. Map each phrase in the description to the capability it triggers. Mark each phrase as: IDENTITY (what the skill is), UNIQUE (the only phrase matching a specific capability), or REINFORCING (overlaps with another phrase's coverage).
   - **STEP 2 — LOSSLESS COMPRESSION**: Remove articles (a, an, the), possessives (my, your) when implied, filler verbs (do, does, can, have, is, am). Merge parallel structures sharing the same verb or object. Stop here if under the limit.
   - **STEP 3 — LOSSY COMPRESSION** (only if still over): Remove REINFORCING phrases only. Keep the more specific phrase when two overlap. In synonym clusters, keep the two most common verbs.
   - **NEVER** remove an IDENTITY phrase or a UNIQUE trigger phrase.
   - **NEVER** rephrase a trigger in a way that changes the core verb or noun.
   - **STEP 4 — VERIFY**: Cross-check the shortened description against the routing table. Every capability must still have at least one matching phrase.
4. After fixing, re-run `validate` to confirm the fix resolved the error.

**Envelope hygiene (`init` / `validate`):** if `next_step.action` or `error.code` is a value not handled above (forward-compat: newer CLI, older skill), surface `next_step.instructions` (or `error.message`) verbatim and **stop; do not improvise**. When the envelope's `warnings[]` is non-empty, surface each entry to the user (non-fatal advisories).

**For descriptions over 250 chars (soft cap)**, the skill is almost certainly a mega-skill — recommend the Constellation Pattern (Constellation Decomposition Workflow, Section 5) rather than just compression. See [references/constellation-pattern.md](references/constellation-pattern.md) for the canonical pattern reference and [references/skill-authoring.md § The Mega-Skill Problem](references/skill-authoring.md) for when each of the three strategies (compress, Constellation Pattern, hybrid) applies.

---

## Section 9 — Constraints

- **NEVER** manually create a skill directory, write `skill.json`, or write any file for a NEW skill before running `npx happyskills init <name> --json`. Manual scaffolding produces a non-managed skill that breaks `validate`, `list`, `publish`, and `sync`. The only exception is editing files inside an existing skill whose directory was previously created by `init`. If a project keeps skills in a non-default location (`.agents/skills/`, etc.), run `init` in `.claude/skills/` first, then relocate. See the STOP pre-flight at the top of this skill.
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
- **NEVER** edit a skill whose status is `drift` — the lock file and on-disk `skill.json` disagree, so any edits compound onto an already-broken baseline. Route to `happyskills-sync` Section 2.5 (Drift Repair) first.
- **NEVER** set `disable-model-invocation: true` on a skill without explicit user confirmation via AskUserQuestion.
- **NEVER** pick a license on the user's behalf during enrichment. MIT is not a default. The Attribution Prompt is MANDATORY — three separate AskUserQuestion calls for `authors`, `license`, then `repository`, in that order. Silently defaulting to MIT (or any other choice) skips a critical user decision and is treated as a workflow failure, not a shortcut. Apply at every Post-Init Enrichment and Kit Enrichment run, every time. The `license` call MUST present exactly these four options, in this order — `MIT`, `Apache-2.0`, `UNLICENSED`, `Show me more` — never improvised, reordered, trimmed, or tagged "Recommended". Do NOT add an Other/Type-something option (the tool injects one) and NEVER drop `Show me more` in favor of it — that option opens the full SPDX catalog for users who don't know the identifier they want. Option descriptions and the Show-me-more follow-up live in [references/workflows.md § Post-Init Enrichment step 6b](references/workflows.md).
- **NEVER** allow forbidden YAML characters in frontmatter values per the current validator: `;`, `:`, `#`, `{`, `}`, `[`, `]`, `'`, `"`, `!`, `&`, `*`, `%`, `|`, `>`. (The new spec allows `:` for namespace prefixes once the validator is updated — until then, use em-dash `—` instead.)
- **PREFER** the new spec format for descriptions: `<Namespace> — <verb-led action>. Use when <specific trigger context>. Not for <where to redirect>.` Soft cap 250 chars. See [references/skill-authoring.md](references/skill-authoring.md) for the full spec.
