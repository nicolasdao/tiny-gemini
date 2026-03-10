# Skill Workflows

## Post-Init Enrichment

After the authoring workflow (Section 7, steps 1–9) completes, the skill has a well-designed SKILL.md but its `skill.json` only has `name` and `version`. Run this enrichment workflow to complete the HappySkills ecosystem metadata and make the skill publish-ready.

1. **Read the SKILL.md** — Understand what the skill does, its domain, and its target audience.
2. **MANDATORY — Verify SKILL.md frontmatter has `name` and `description`** — The authoring workflow (step 6) should have set these, but verify they are present and non-empty. If the `description` is still the placeholder ("Describe what this skill does and when to invoke it"), replace it with a proper keyword-rich description following the formula: `[action verb] + [specific domain] + [use case] + [natural trigger phrases]`. Use only safe characters (no semicolons, colons, or other forbidden YAML characters). Ask the user to confirm. This step is NON-NEGOTIABLE — the CLI will warn on publish if description is missing.
3. **Write skill.json `description`** — A concise summary (under 200 chars) optimized for registry search. This is different from the SKILL.md `description` which targets Claude auto-invocation.
4. **Suggest `keywords`** — Based on the skill's content, propose canonical slugs (e.g., `deployment`, `testing`, `api`) plus any relevant custom keywords. Use AskUserQuestion to confirm.
5. **Detect system dependencies** — If the SKILL.md references external CLIs (e.g., `docker`, `aws`, `terraform`, `kubectl`), suggest adding `systemDependencies` to skill.json with check/install commands.
6. **Detect skill dependencies** — If the SKILL.md references other published HappySkills skills, suggest adding them to `dependencies`.
7. **Prompt for optional fields** — Use AskUserQuestion to ask if the user wants to set `authors`, `license`, or `repository`.
8. **Confirm invocation model** — Check whether the SKILL.md has `disable-model-invocation: true`. If it does, or if you're about to set it, use AskUserQuestion to confirm the user's preference:
   - **"Auto-invoke (Recommended)"** — Claude automatically invokes the skill when relevant. Best for most skills. Do NOT add the `disable-model-invocation` flag.
   - **"User-only (/slash command)"** — Only the user can trigger it via `/skill-name`. Claude will not know the skill exists and cannot invoke it automatically. Recommended only for destructive operations like deployments, releases, or deletes.
   **Default to auto-invoke. NEVER set `disable-model-invocation: true` without asking the user first.**
9. **Initialize CHANGELOG.md** — If none exists, create one with the initial version entry.
10. **Optional publish** — Use AskUserQuestion to ask: "Would you like to publish this skill now, or test it first?" with options:
   1. **"Publish now"** — Authenticate (Section 2), then resolve the target workspace by running `npx happyskills whoami --json`: if one workspace use it, if multiple check `skills-lock.json` (in the project root) for a `<slug>/<skill-name>` key and use the matching workspace, if zero or multiple matches ask the user via AskUserQuestion. Then ask about visibility with exactly these options in this order:
       1. **"Private (Recommended)"** — MUST be the FIRST option. Description: "Only visible to members of your workspace."
       2. **"Public"** — MUST be the SECOND option. Description: "Visible in the public catalog to all users."
       NEVER present "Public" as the first or default option. Then run `npx happyskills publish <skill-name> --workspace <slug> --json` (add `--public` if chosen). NEVER run publish without `--workspace`.
   2. **"Test first"** — Done. Tell the user they can publish later with `happyskills publish <skill-name>`.

## Post-Convert Enrichment

After `happyskills convert` succeeds, the skill has a basic `skill.json` (name, version, workspace) but is **not yet published** — it is missing the metadata that makes it discoverable, well-documented, and publish-ready. Run this enrichment workflow automatically after every conversion, then publish as the final step.

**Important**: Do NOT alter the SKILL.md body content — it is the user's original work. Only enrich `skill.json`, add supplementary HappySkills files, and ensure SKILL.md frontmatter has the required fields.

1. **Read the SKILL.md** — Understand what the skill does, its domain, and its target audience.
2. **MANDATORY — Ensure SKILL.md frontmatter has `name` and `description`** — Check if the SKILL.md has a YAML frontmatter block (`---`). If NOT, you MUST add one. If it exists but is missing `name` or `description`, you MUST add the missing fields. The `description` is the #1 factor for Claude auto-invocation quality — without it, the skill will silently fail to trigger. Write a keyword-rich description following the formula: `[action verb] + [specific domain] + [use case] + [natural trigger phrases]`. Use only safe characters (no semicolons, colons, or other forbidden YAML characters). Ask the user to confirm the description before writing it. This step is NON-NEGOTIABLE — do not skip it under any circumstances.
3. **Write skill.json `description`** — A concise summary (under 200 chars) optimized for registry search. This is different from the SKILL.md `description` which targets Claude auto-invocation.
4. **Suggest `keywords`** — Based on the skill's content, propose canonical slugs (e.g., `deployment`, `testing`, `api`) plus any relevant custom keywords. Use AskUserQuestion to confirm.
5. **Detect system dependencies** — If the SKILL.md references external CLIs (e.g., `docker`, `aws`, `terraform`, `kubectl`), suggest adding `systemDependencies` to skill.json with check/install commands.
6. **Detect skill dependencies** — If the SKILL.md references other published HappySkills skills, suggest adding them to `dependencies`.
7. **Prompt for optional fields** — Use AskUserQuestion to ask if the user wants to set `authors`, `license`, or `repository`.
8. **Confirm invocation model** — Check whether the SKILL.md has `disable-model-invocation: true`. If it does, use AskUserQuestion to confirm the user's preference:
   - **"Auto-invoke (Recommended)"** — Claude automatically invokes the skill when relevant. Best for most skills. Remove the `disable-model-invocation: true` flag.
   - **"User-only (/slash command)"** — Only the user can trigger it via `/skill-name`. Claude will not know the skill exists and cannot invoke it automatically. Recommended only for destructive operations like deployments, releases, or deletes.
   **Default to auto-invoke. NEVER keep `disable-model-invocation: true` without confirming with the user.**
9. **Initialize CHANGELOG.md** — If none exists, create one with the initial version entry.
10. **Publish to the registry** — First, resolve the target workspace by running `npx happyskills whoami --json`: if one workspace use it, if multiple check `skills-lock.json` (in the project root) for a `<slug>/<skill-name>` key and use the matching workspace, if zero or multiple matches ask the user via AskUserQuestion. Then ask about visibility with exactly these options in this order:
   1. **"Private (Recommended)"** — MUST be the FIRST option. Description: "Only visible to members of your workspace."
   2. **"Public"** — MUST be the SECOND option. Description: "Visible in the public catalog to all users."
   NEVER present "Public" as the first or default option. Then run the appropriate command (ALWAYS include `--workspace`):
   - Private: `npx happyskills publish <skill-name> --workspace <slug> --json`
   - Public: `npx happyskills publish <skill-name> --workspace <slug> --public --json`

   This is the first publish — `convert` no longer auto-publishes.

## Post-Fork Enrichment

After `happyskills fork` succeeds, the forked skill has its version reset to `0.1.0` and dependencies cleared. Run this enrichment automatically after every fork.

1. **Read the forked SKILL.md** — Understand what the original skill does.
2. **MANDATORY — Ensure SKILL.md frontmatter has `name` and `description`** — Check if the forked SKILL.md has a YAML frontmatter block (`---`) with both `name` and `description`. If either is missing or empty, you MUST add them. The `description` is the #1 factor for Claude auto-invocation quality — without it, the skill will silently fail to trigger. The fork may serve a different purpose than the original, so ask the user what they plan to change and write an appropriate description. Use only safe characters (no semicolons, colons, or other forbidden YAML characters). This step is NON-NEGOTIABLE.
3. **Write skill.json `description`** — A concise summary (under 200 chars) optimized for registry search. This is different from the SKILL.md `description` which targets Claude auto-invocation.
4. **Suggest `keywords`** — Propose canonical slugs based on the skill's content. Use AskUserQuestion to confirm.
5. **Re-evaluate dependencies** — The original skill's dependencies were cleared. Read the SKILL.md to detect if it references other skills or external CLIs, and suggest re-adding the relevant `dependencies` and `systemDependencies`.
6. **Prompt for optional fields** — `authors`, `license`, `repository`.
7. **Confirm invocation model** — Check whether the forked SKILL.md has `disable-model-invocation: true`. If it does, use AskUserQuestion to confirm the user's preference:
   - **"Auto-invoke (Recommended)"** — Claude automatically invokes the skill when relevant. Best for most skills. Remove the `disable-model-invocation: true` flag.
   - **"User-only (/slash command)"** — Only the user can trigger it via `/skill-name`. Claude will not know the skill exists and cannot invoke it automatically. Recommended only for destructive operations like deployments, releases, or deletes.
   **Default to auto-invoke. NEVER keep `disable-model-invocation: true` without confirming with the user.**
8. **Initialize CHANGELOG.md** — Create one with a `0.1.0` entry noting it was forked from the original (include `forked_from` info).

## Skill Release Workflow

When the user wants to release/ship a skill update, run this end-to-end pipeline. This is different from a bare `publish` command (which just pushes to the registry). The release workflow is the intelligent, full-lifecycle process.

**1. Identify the skill and read current state**

- Locate the skill directory and read its `skill.json` to get the current version.
- Read the existing `CHANGELOG.md` (if any) to understand what's already been documented.

**2. Analyze changes**

Review what changed since the last release. Use multiple sources:
- Conversation context (what the LLM did in this session)
- `git diff` and `git log` within the skill directory (if in a git repo)
- File modification timestamps

Classify each change:

| Change Type | Bump | Examples |
|---|---|---|
| Bug fixes, typos, corrections | `patch` | Fixed typo in description, fixed broken command |
| New features, new sections, new capabilities | `minor` | Added new command support, added authoring mode |
| Breaking changes | `major` | Changed invocation model, restructured frontmatter, removed features, renamed skill |

**3. Propose bump type and confirm**

Present the inferred bump type with reasoning. Use AskUserQuestion to let the user confirm or override:
- "Based on the changes (added X, fixed Y), I recommend a **minor** bump (1.0.0 → 1.1.0). Does that look right?"

**4. Pre-release validation**

Before bumping, verify the skill is publish-ready. These checks are **mandatory** — do NOT proceed to bump/publish if any fail:
- `skill.json` has `description` (not empty)
- `skill.json` has `keywords` (at least one canonical slug)
- `SKILL.md` exists and has YAML frontmatter (`---`) with both `name` and `description`
- The SKILL.md `description` is keyword-rich (not a placeholder like "Describe what this skill does")
- The SKILL.md `description` uses only safe characters (no semicolons, colons, or other forbidden YAML characters)
- If any are missing, fix them before proceeding. The `description` in SKILL.md frontmatter is the #1 factor for Claude auto-invocation — without it, the skill will silently fail to trigger.

**5. Bump the version**

```bash
npx happyskills bump <patch|minor|major> <skill-name> --json
```

Parse the response to get the new version number.

**6. Update CHANGELOG.md**

Write a new entry at the top of the changelog (below the `# Changelog` heading), following the Keep a Changelog format:

```markdown
## [X.Y.Z] - YYYY-MM-DD

### Added
- New feature descriptions

### Changed
- Modifications to existing features

### Fixed
- Bug fix descriptions

### Removed
- Removed feature descriptions
```

Only include the groups (`### Added`, `### Changed`, `### Fixed`, `### Removed`) that have entries. If `CHANGELOG.md` does not exist, create it with the `# Changelog` heading and the new entry.

**7. Resolve workspace and publish**

First, resolve the target workspace by running `npx happyskills whoami --json`: if one workspace use it, if multiple check `skills-lock.json` (in the project root) for a `<slug>/<skill-name>` key and use the matching workspace, if zero or multiple matches ask the user via AskUserQuestion.

Show a summary of what will be published:
- Skill name and workspace
- Version: old → new
- Changes (from changelog entry)

Use AskUserQuestion for final confirmation. Do NOT ask about visibility — this is an update to an existing skill, so the server preserves the existing visibility automatically. Then run (ALWAYS include `--workspace`):

```bash
npx happyskills publish <skill-name> --workspace <slug> --json
```

Parse and present the result: "Published owner/name@X.Y.Z to the registry."
