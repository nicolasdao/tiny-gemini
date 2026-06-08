---
name: happyskills-publish
description: HappySkills — Publish skills to the registry. Use when shipping a new version, bumping a version, validating, converting an external skill, forking, deleting from the registry, or changing visibility. Not for designing or syncing skills.
allowed-tools: Bash, Read, Write, Edit, Glob, Grep, AskUserQuestion
argument-hint: "[your publish request]"
---

# HappySkills Publish

You ship skills to the registry. You own version bumps, validation, the publish flow (with mandatory pre-flight checks), the full release workflow (analyze changes + bump + changelog + publish), and registry-management actions (convert external skills, fork managed skills, delete, change visibility).

The user's request is: `$ARGUMENTS`

---

## Section 1 — Route the Request

| User Intent | Action |
|---|---|
| "publish my skill", "push to registry", "release skill", "ship this update" | Publish with pre-flight (Section 3) |
| "release a skill", "release my skill", "ship my changes", "publish my skill update", "update and publish skill", "push skill changes" | Skill Release Workflow (Section 4 — full pipeline) |
| "bump version", "increment version", "patch bump", "minor bump", "major bump" | `bump` (Section 5) |
| "validate", "check my skill", "is my skill valid", "lint my skill", "verify my skill" | `validate` (Section 6) |
| "convert", "make managed", "register external skill" | `convert` + Post-Convert Enrichment (Section 7) |
| "fork", "copy skill", "clone skill" | `fork` + Post-Fork Enrichment (Section 8) |
| "delete skill from registry", "remove from registry", "permanently delete" | `delete` (Section 9 — destructive, confirm) |
| "visibility", "change visibility", "make public", "make private", "set visibility" | `visibility` (Section 10) |

**Disambiguation rules:**

- "Publish" alone → Section 3 (with pre-flight). If the user says "release" or hints at a multi-step ship (analyzing changes, writing changelog), use Section 4 (full Release Workflow) instead.
- "Update" with a skill name and a version → it's `update` (CLI lifecycle command, owned by core). Route the user: "say 'upgrade owner/X' and core will handle it." But "update this skill based on what we did" is content modification — route to `happyskills-design`.
- "Delete" alone → could mean uninstall (core) or registry delete. Ask which: "Do you want to uninstall locally (just remove from this project), or delete from the registry (irreversible)?"
- "Convert" alone → `convert` (Section 7). Always followed by Post-Convert Enrichment.
- "Fork" alone → `fork` (Section 8). Always followed by Post-Fork Enrichment.
- "Why can't I publish" / "publish rejected" / "diverged" → divergence issue. Route to `happyskills-sync`: "say 'why can't I publish' and sync will diagnose."

For the full workflows (release, post-convert enrichment, post-fork enrichment, first-time publish, workspace resolution) read [references/workflows.md](references/workflows.md). For exact CLI syntax and JSON shapes, read [references/cli-reference.md](references/cli-reference.md).

---

## Section 2 — Authentication

`publish`, `fork`, `delete`, `visibility` all require auth. `convert` is optional auth (when not logged in, requires `--workspace` and skips registry conflict check).

Before running any auth-requiring command:

```bash
npx happyskills login --json --browser
```

Use a Bash timeout of 360000ms (6 minutes). The CLI auto-opens the browser. Single command handles both checking and authenticating:
- Already logged in → returns `{"data": {"status": "already_logged_in", ...}}` and proceeds.
- Not logged in → opens browser, returns `{"data": {"status": "logged_in", ...}}` after approval.

If the browser flow fails (headless environment), tell the user to run `npx happyskills login --password` manually in a separate terminal, then re-check.

If a command fails with exit code 3 (`AUTH_REQUIRED`), trigger the auth flow and retry once.

---

## Section 3 — Publish (with Mandatory Pre-Flight)

Before running `npx happyskills publish`, run these pre-flight checks **in order**:

1. **Check if the skill is managed** — Run `npx happyskills list --json` and check `data.skills` (managed) vs `data.external` (external). If external, tell the user the skill needs to be converted first, and offer to run `convert` (Section 7). Do not attempt to publish an unconverted skill.

2. **Check divergence state (MANDATORY)** — Run `npx happyskills status <workspace>/<skill-name> --json`. Check `status`:
   - `clean` or `modified` → safe to proceed.
   - `outdated` → remote has advanced. Route to `happyskills-sync` ("say 'pull remote changes for X'") then return here.
   - `diverged` → both local and remote changed. Route to sync to merge. If conflicts, sync guides resolution. Then return here.
   - `conflicts` → unresolved markers. Route to sync to resolve. Then return here.

3. **Run validation (MANDATORY)** — Run `npx happyskills validate <skill-name> --json`. If `data.valid` is `false`, follow the Validate Error Handling procedure (Section 11). Do NOT publish a skill that fails validation. Warnings are advisory — present but do not block. **If you had to fix validation errors** (modified any skill files), those fixes are new changes that must be versioned and documented before publishing — go to Section 4 (Release Workflow) instead of bare publish.

4. **Resolve target workspace (MANDATORY)** — Run the **Workspace Resolution** procedure ([references/workflows.md § Workspace Resolution](references/workflows.md)). You **MUST** pass `--workspace <slug>` in every publish command — never run publish without it.

5. **Read `CHANGELOG.md` and `skill.json`** in the skill's directory.

6. **Review changes since the last CHANGELOG entry** — have there been modifications?

7. **If the version is already bumped and CHANGELOG covers the current changes AND no validation fixes were applied in step 3** → proceed to publish (step 9). Otherwise → run the Skill Release Workflow (Section 4) which handles bump + changelog + publish.

8. **(Reserved — handled by Section 4 if reached.)**

9. **Confirm with AskUserQuestion** before publishing. Show the skill name, version, and target workspace. To detect a **first publish**, run `npx happyskills check <workspace>/<skill-name> --json`. If the response contains an error (skill not found in the registry), this is a first publish — ask about visibility using exactly these options in this order:
   1. **"Private (Recommended)"** — MUST be the FIRST option. Description: "Only visible to members of your workspace."
   2. **"Public"** — MUST be the SECOND option. Description: "Visible in the public catalog to all users."

   NEVER present "Public" as the first or default option for a first-time publish. NEVER use the lock file `commit` field to detect first publish — locally developed skills always have `commit: null` even after publishing. If `happyskills check` returns version data (skill exists in the registry), do NOT ask about visibility — the existing visibility is preserved automatically by the server.

```bash
# ALWAYS include --workspace
npx happyskills publish my-skill --workspace <slug> --json

# Publish as public on first publish
npx happyskills publish my-skill --workspace <slug> --public --json

# Auto-bump before publishing (use Section 4 instead for full release workflow)
npx happyskills publish my-skill --workspace <slug> --bump patch --json
```

Show the published skill name, version, and ref.

**NEVER pipe `publish` (or any `--json` command that emits progress lines) through a strict JSON parser.** The CLI prints non-JSON status text such as `Preparing to publish...` to stdout *before* the JSON envelope. Strict parsers like `python3 -m json.tool` or `jq -e .` choke on that prefix and report a parse error, **masking whether the underlying operation succeeded**. Run `publish` without piping (let stdout flow to the terminal so you can read the `Published owner/name@version` line and the JSON together), or capture the full output and parse only the JSON line.

**If publish returns a DIVERGED error** (someone published between your status check and your publish — TOCTOU): route to `happyskills-sync` to pull and re-merge, then re-run publish.

**Merge commits:** When the lock entry contains `merge_parents` (set by a prior `pull` that auto-merged without conflicts), `publish` automatically sends them as `parent_shas`. The server creates a merge commit with two parents. Transparent — no extra flags needed. After successful publish, both `merge_parents` and `conflict_files` are cleared from the lock.

---

## Section 4 — Skill Release Workflow

When the user wants to release/ship a skill update, run the full pipeline. This is different from a bare `publish` — it analyzes changes, infers semver bump, updates changelog, and publishes.

**Always invoke this workflow when releasing — including when releasing the `happyskills` skill family itself.** Do not improvise an ad-hoc release by hand-editing `skill.json` to bump the version, hand-writing a CHANGELOG entry, and then calling `publish` directly. Each of those steps has a dedicated tool (`bump`, `validate`, `publish`) and the workflow orders them correctly (validate before bump, re-validate after CHANGELOG edits, publish last). Skipping the workflow skips the safeguards — most commonly you'll discover a validation failure *after* bumping, leaving the version and changelog needing a follow-up patch release to clean up.

**Quick steps** (full procedure with all guardrails: [references/workflows.md § Skill Release Workflow](references/workflows.md)):

1. **Identify the skill and read current state** — locate directory, read `skill.json` (current version), read `CHANGELOG.md`.
2. **Analyze changes** — review session context + `git diff` + `git log` within the skill directory + file mtimes. Classify each change:

   | Change Type | Bump | Examples |
   |---|---|---|
   | Bug fixes, typos, corrections | `patch` | Fixed typo in description, fixed broken command |
   | New features, new sections, new capabilities | `minor` | Added new command support, added authoring mode |
   | Breaking changes | `major` | Changed invocation model, restructured frontmatter, removed features, renamed skill |

3. **Propose bump type and confirm** — present inferred bump with reasoning, use AskUserQuestion to confirm or override.
4. **Pre-release validation (MANDATORY)** — run `npx happyskills validate <skill-name> --json`. If errors → fix per Section 11. If validation fixes modified files → re-run validate, re-evaluate bump, document fixes in changelog.
5. **Bump the version** — `npx happyskills bump <patch|minor|major> <skill-name> --json`. Parse the new version.
6. **Update CHANGELOG.md** — write a new entry at the top following Keep a Changelog format. Only include groups (`### Added`, `### Changed`, `### Fixed`, `### Removed`) that have entries.
7. **Resolve workspace** — run Workspace Resolution ([references/workflows.md](references/workflows.md)).
8. **Confirm and publish** — show summary (skill, workspace, version old → new, changes), AskUserQuestion for final confirmation, then `npx happyskills publish <skill-name> --workspace <slug> --json`. Do NOT ask about visibility on updates — the server preserves existing visibility automatically.

---

## Section 5 — Bump

```bash
npx happyskills bump patch my-skill --json
npx happyskills bump minor my-skill --json
npx happyskills bump major my-skill --json
npx happyskills bump 2.0.0 my-skill --json    # explicit version
```

Show old → new version. Use `bump` from within the Release Workflow (Section 4) when shipping; standalone `bump` is for cases where the user just wants to increment without publishing yet.

---

## Section 6 — Validate

```bash
npx happyskills validate my-skill --json
npx happyskills validate my-skill -g --json
```

JSON response: `data.valid` (boolean), `data.errors` (array), `data.warnings` (array), `checks_passed`, `checks_failed`, `checks_warned`. Exit 0 = all pass, exit 1 = errors found.

If `data.valid` is `false`, present each error with file/field/message, follow Section 11 (Validate Error Handling), and offer to fix automatically. Warnings are advisory.

---

## Section 7 — Convert (External → Managed)

Convert an existing external skill into a HappySkills-managed skill.

```bash
# Authenticated — auto-resolves workspace and checks registry for conflicts
npx happyskills convert skill-name -y --json

# Not authenticated — must provide --workspace (registry check skipped)
npx happyskills convert skill-name --workspace myorg -y --json

# With version override
npx happyskills convert skill-name --workspace myorg --version 1.0.0 -y --json

# Convert a global skill
npx happyskills convert skill-name -g -y --json
```

After successful conversion, **always run Post-Convert Enrichment** ([references/workflows.md § Post-Convert Enrichment](references/workflows.md)). This enriches `skill.json` with description, keywords, dependencies, system dependencies, optional fields, and CHANGELOG, then publishes. Do NOT alter SKILL.md content during enrichment — that's the user's original work.

---

## Section 8 — Fork

Fork a managed skill into your own workspace.

```bash
npx happyskills fork owner/name --json

# Fork to a specific workspace
npx happyskills fork owner/name --workspace myorg --json
```

After successful fork, **always run Post-Fork Enrichment** ([references/workflows.md § Post-Fork Enrichment](references/workflows.md)). This sets up the forked skill's metadata (description, keywords, re-evaluates dependencies, CHANGELOG with `forked_from` info).

---

## Section 9 — Delete from Registry

```bash
npx happyskills delete owner/name --json -y
```

Confirm with AskUserQuestion before running — this is irreversible. Show "Deleted owner/name from the registry."

---

## Section 10 — Visibility

```bash
npx happyskills visibility owner/name --json                  # get current
npx happyskills visibility owner/name public --json            # set: public/private/workspace
```

Show "Visibility for owner/name is public" (get) or "Visibility for owner/name set to public" (set).

---

## Section 11 — Validate Error Handling

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

For long-form description issues (above 250 chars under the new spec), consider whether the skill is a mega-skill — route to `happyskills-design` to recommend decomposition (audit workflow).

---

## Section 12 — Constraints

- **ALWAYS** use `--json` on every command.
- **ALWAYS** add `-y` flag to commands that support it (`convert`, `delete`) since you handle confirmations via AskUserQuestion.
- **ALWAYS** confirm with AskUserQuestion before destructive operations: `publish` (always), `delete`, `visibility` change to public, anything irreversible.
- **ALWAYS** include `--workspace <slug>` on every `publish` command. Never publish without it.
- **ALWAYS** run pre-flight checks (Section 3) before any publish — never bypass them.
- **NEVER** run `npx happyskills login --password` — exposes credentials in the LLM context. Use the browser flow only.
- **NEVER** fabricate CLI flags or subcommands not documented in this skill or [references/cli-reference.md](references/cli-reference.md).
- **NEVER** modify `skill.json` directly to bump the version — use `npx happyskills bump`. The constraint at "NEVER modify files directly for CLI package management" applies here: bumping is a package management operation.
- **NEVER** modify SKILL.md content during convert/fork enrichment — only enrich `skill.json` and supplementary files.
- **NEVER** publish a skill that fails validation. If validation fails, follow Section 11 to fix, then re-validate.
- **NEVER** present "Public" as the first or default visibility option on first publish. Private MUST be first.
- **NEVER** invoke `pull`, `diff`, `status`, or any other sync/install/design action. Route the user to the appropriate skill.
- **ALWAYS** run `npx happyskills` from the **project root** (the directory containing `.claude/`).
- **PREFER** the Release Workflow (Section 4) over bare `publish` (Section 3) when there are unbumped or undocumented changes.
