# Skill Workflows

## Post-Convert Enrichment

After `happyskills convert` succeeds, the skill has a basic `skill.json` (name, version, workspace) but is **not yet published** — it is missing the metadata that makes it discoverable, well-documented, and publish-ready. Run this enrichment workflow automatically after every conversion, then publish as the final step.

**Important**: Do NOT alter the SKILL.md content — it is the user's original work. Only enrich `skill.json` and add supplementary HappySkills files.

1. **Read the SKILL.md** — Understand what the skill does, its domain, and its target audience.
2. **Write skill.json `description`** — A concise summary (under 200 chars) optimized for registry search. This is different from the SKILL.md `description` which targets Claude auto-invocation.
3. **Suggest `keywords`** — Based on the skill's content, propose canonical slugs (e.g., `deployment`, `testing`, `api`) plus any relevant custom keywords. Use AskUserQuestion to confirm.
4. **Detect system dependencies** — If the SKILL.md references external CLIs (e.g., `docker`, `aws`, `terraform`, `kubectl`), suggest adding `systemDependencies` to skill.json with check/install commands.
5. **Detect skill dependencies** — If the SKILL.md references other published HappySkills skills, suggest adding them to `dependencies`.
6. **Prompt for optional fields** — Use AskUserQuestion to ask if the user wants to set `authors`, `license`, or `repository`.
7. **Review SKILL.md description** — Check if the SKILL.md frontmatter `description` is keyword-rich for auto-invocation. If it's vague or missing, suggest an improved version but ask before modifying (this is the one exception where you may edit SKILL.md, only with explicit user consent).
8. **Initialize CHANGELOG.md** — If none exists, create one with the initial version entry.
9. **Publish to the registry** — Use AskUserQuestion to ask whether the skill should be public or private (default is private). Then run the appropriate command:
   - Private: `npx happyskills publish <skill-name> --json`
   - Public: `npx happyskills publish <skill-name> --public --json`

   This is the first publish — `convert` no longer auto-publishes.

## Post-Fork Enrichment

After `happyskills fork` succeeds, the forked skill has its version reset to `0.1.0` and dependencies cleared. Run this enrichment automatically after every fork.

1. **Read the forked SKILL.md** — Understand what the original skill does.
2. **Write skill.json `description`** — The fork may serve a different purpose than the original. Ask the user what they plan to change, then write an appropriate description.
3. **Suggest `keywords`** — Propose canonical slugs based on the skill's content. Use AskUserQuestion to confirm.
4. **Re-evaluate dependencies** — The original skill's dependencies were cleared. Read the SKILL.md to detect if it references other skills or external CLIs, and suggest re-adding the relevant `dependencies` and `systemDependencies`.
5. **Prompt for optional fields** — `authors`, `license`, `repository`.
6. **Initialize CHANGELOG.md** — Create one with a `0.1.0` entry noting it was forked from the original (include `forked_from` info).

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

Before bumping, verify the skill is publish-ready:
- `skill.json` has `description` (not empty)
- `skill.json` has `keywords` (at least one canonical slug)
- `SKILL.md` exists and has a `description` in frontmatter
- If any are missing, fix them first (using the authoring workflow or post-convert enrichment).

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

**7. Confirm and publish**

Show a summary of what will be published:
- Skill name and workspace
- Version: old → new
- Changes (from changelog entry)

Use AskUserQuestion for final confirmation. Do NOT ask about visibility — this is an update to an existing skill, so the server preserves the existing visibility automatically. Then run:

```bash
npx happyskills publish <skill-name> --json
```

Parse and present the result: "Published owner/name@X.Y.Z to the registry."
