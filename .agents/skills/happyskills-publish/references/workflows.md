# happyskills-publish — Workflows

Full step-by-step procedures for publish-related workflows. SKILL.md has the quick steps and routing; this file has the complete procedures with all guardrails.

## Common Procedures

### Optional Fields Prompt

When enriching a skill (post-convert, post-fork), ask about each of the following fields individually. Do NOT skip any.

**a. `authors`** — Use AskUserQuestion to ask if the user wants to add authors. Suggest a format like `"Jane Doe <jane@acme.com>"`.

**b. `license`** — Use AskUserQuestion with these exact options in this order:
   1. **"MIT"** — Description: "Permissive. Do anything, just include the license text."
   2. **"BSD-3-Clause"** — Description: "Permissive with no-endorsement clause."
   3. **"Apache-2.0"** — Description: "Permissive with patent protection."
   4. **"Show me more"** — Description: "See all available licenses."

   If the user selects **"Show me more"**, display this reference table:

   **Permissive:**
   | SPDX ID | Description |
   |---------|-------------|
   | MIT | Do anything, just include the license text |
   | ISC | Functionally identical to MIT, shorter wording |
   | BSD-2-Clause | Two conditions — retain notice, no liability |
   | BSD-3-Clause | Like BSD-2 plus no-endorsement clause |
   | Apache-2.0 | Like MIT plus patent grant, must state changes |

   **Copyleft:**
   | SPDX ID | Description |
   |---------|-------------|
   | GPL-3.0-only | Strong copyleft — derivatives must also be GPL |
   | LGPL-3.0-only | Weaker copyleft — libraries can be linked from proprietary code |
   | MPL-2.0 | File-level copyleft — modified files stay MPL, rest can be proprietary |
   | AGPL-3.0-only | Like GPL but covers network/SaaS use |

   **Public Domain:**
   | SPDX ID | Description |
   |---------|-------------|
   | CC0-1.0 | Full public domain dedication, zero restrictions |
   | 0BSD | Public domain as a formal license |

   **Proprietary:**
   | Value | Description |
   |-------|-------------|
   | UNLICENSED | All rights reserved, no reuse allowed |

   Then use a second AskUserQuestion with:
   1. **"UNLICENSED"** — Description: "All rights reserved (private/internal skills)."
   2. **"GPL-3.0-only"** — Description: "Strong copyleft — derivatives must be GPL."
   3. **"MPL-2.0"** — Description: "File-level copyleft — modified files stay MPL."
   4. **"CC0-1.0"** — Description: "Public domain dedication, zero restrictions."

   The automatic "Other" option is available at both tiers for any SPDX identifier not listed.

   **After the user selects a license, generate a LICENSE file** in the skill directory:
   - **Copyright holder**: Reuse the `authors` value from the authors prompt above. If no authors were set, use AskUserQuestion to ask for a copyright holder name (person or company name — no legal registration numbers needed, just a name).
   - **Year**: Use the current year.
   - **License text**: Write the standard license text for the chosen SPDX identifier. For licenses that include a copyright line (MIT, ISC, BSD-2-Clause, BSD-3-Clause, 0BSD, UNLICENSED), insert `Copyright (c) [year] [name]` at the top. For licenses with standardized text and no copyright line in the body (Apache-2.0, GPL-3.0-only, LGPL-3.0-only, AGPL-3.0-only, MPL-2.0), write the standard text as-is. For CC0-1.0, write the standard dedication text.
   - Write the file as `LICENSE` (no extension) in the skill directory using the Write tool.

**c. `repository`** — Before asking, run `git remote get-url origin 2>/dev/null` to detect the current git remote URL.
   - If a remote URL is found, use AskUserQuestion with:
     1. **"Yes, use <detected-url>"** — Description: "Set repository to the detected git remote."
     2. **"No, skip"** — Description: "Don't set a repository URL."
   The automatic "Other" option lets the user enter a different URL.
   - If no remote URL is found, use AskUserQuestion with:
     1. **"Enter a URL"** — Description: "Provide a repository URL manually."
     2. **"Skip"** — Description: "Don't set a repository URL."

### Invocation Model Confirmation

When an enrichment workflow needs to confirm the user's invocation preference, present these two options via AskUserQuestion:

- **"Auto-invoke (Recommended)"** — Claude automatically invokes the skill when relevant. Best for most skills.
- **"User-only (/slash command)"** — Only the user can trigger it via `/skill-name`. Claude will not know the skill exists and cannot invoke it automatically. Recommended only for destructive operations like deployments, releases, or deletes.

**Default to auto-invoke.** Action depends on the skill's current state:
- **Existing skill** (Post-Convert, Post-Fork): Remove the `disable-model-invocation: true` flag if present. NEVER keep it without confirming.

### Workspace Resolution

Resolve the target workspace for publishing by running `npx happyskills whoami --json`:

1. If exactly one workspace → use it.
2. If multiple workspaces → check `skills-lock.json` (in the project root) for a `<slug>/<skill-name>` key. Use the matching workspace.
3. If zero or multiple matches → ask via AskUserQuestion which workspace.

### First-Time Publish

Use this procedure when publishing a skill for the first time (Post-Convert, Post-Fork enrichment, or any first-time scenario). For releasing updates to already-published skills, use the Skill Release Workflow instead.

1. **Authenticate** — Run the auth flow (Section 2 of SKILL.md).
2. **Resolve workspace** — Run the **Workspace Resolution** procedure above.
3. **Visibility** — Ask with exactly these options in this order:
   1. **"Private (Recommended)"** — MUST be the FIRST option. Description: "Only visible to members of your workspace."
   2. **"Public"** — MUST be the SECOND option. Description: "Visible in the public catalog to all users."

   NEVER present "Public" as the first or default option.
4. **Publish** — Run the appropriate command (ALWAYS include `--workspace`):
   - Private: `npx happyskills publish <skill-name> --workspace <slug> --json`
   - Public: `npx happyskills publish <skill-name> --workspace <slug> --public --json`

---

## Post-Convert Enrichment

After `happyskills convert` succeeds, the skill has a basic `skill.json` (name, version, workspace) but is **not yet published** — it is missing the metadata that makes it discoverable, well-documented, and publish-ready. Run this enrichment workflow automatically after every conversion, then publish as the final step.

**Important**: Do NOT alter the SKILL.md body content — it is the user's original work. Only enrich `skill.json`, add supplementary HappySkills files, and ensure SKILL.md frontmatter has the required fields.

1. **Read the SKILL.md** — Understand what the skill does, its domain, and target audience.
2. **MANDATORY — Ensure SKILL.md frontmatter has `name` and `description`** — Check if the SKILL.md has a YAML frontmatter block (`---`). If NOT, you MUST add one. If it exists but is missing `name` or `description`, you MUST add the missing fields. The `description` is the #1 factor for Claude auto-invocation quality — without it, the skill will silently fail to trigger. Write a description following the canonical format from spec 260501-mega-skill-refactor: `<Namespace> — <verb-led action>. Use when <specific trigger context>. Not for <where to redirect>.` Target 80-180 chars (250 soft cap, 1024 hard cap). Use em-dash, not colon, for the namespace separator. Use only safe characters (no semicolons, colons, or other forbidden YAML characters per the current validator). Route the user to `happyskills-design` ("say 'review my SKILL.md description' and design will help shape it") for the full format guide. Ask the user to confirm the description before writing it. This step is NON-NEGOTIABLE.
3. **Write skill.json `description`** — A concise summary (under 200 chars) optimized for registry search. This is different from the SKILL.md `description` which targets Claude auto-invocation.
4. **Suggest `keywords`** — Based on the skill's content, propose canonical slugs (e.g., `deployment`, `testing`, `api`) plus any relevant custom keywords. Use AskUserQuestion to confirm.
5. **Detect system dependencies (MANDATORY scan, not best-effort)** — Scan SKILL.md and every file under `scripts/` for command invocations, extract the unique binaries called, subtract the POSIX baseline, and declare **every remaining binary** in `systemDependencies` — including ubiquitous tools like `git`, `node`, `npm`, `npx`, `python`, `python3`, `pip`, `curl`, and `jq`. **Do NOT skip a tool because "it's always installed"** — the skill's host may be a Docker container, CI runner, or sandbox where it is not.
6. **Detect skill dependencies** — If the SKILL.md references other published HappySkills skills, suggest adding them to `dependencies`.
7. **Prompt for optional fields** — Run the **Optional Fields Prompt** procedure (Common Procedures above).
8. **Confirm invocation model** — Check whether the SKILL.md has `disable-model-invocation: true`. If it does, run the **Invocation Model Confirmation** procedure. For existing skills, the action is "remove the flag."
9. **Initialize CHANGELOG.md** — If none exists, create one with the initial version entry.
10. **Run validation (MANDATORY)** — Run `npx happyskills validate <skill-name> --json`. If `data.valid` is `false`, fix all errors before proceeding to publish — see Section 11 of SKILL.md.
11. **Publish to the registry** — Run the **First-Time Publish** procedure above.

---

## Post-Fork Enrichment

After `happyskills fork` succeeds, the forked skill has its version reset to `0.1.0` and dependencies cleared. Run this enrichment automatically after every fork.

1. **Read the forked SKILL.md** — Understand what the original skill does.
2. **MANDATORY — Ensure SKILL.md frontmatter has `name` and `description`** — Check that the forked SKILL.md has a YAML frontmatter block (`---`) with both `name` and `description`. If either is missing or empty, you MUST add them. The fork may serve a different purpose than the original, so ask the user what they plan to change and write a description following the canonical format from spec 260501-mega-skill-refactor: `<Namespace> — <verb-led action>. Use when <specific trigger context>. Not for <where to redirect>.` Target 80-180 chars (250 soft cap, 1024 hard cap). Use em-dash, not colon, for the namespace separator. Use only safe characters. Route the user to `happyskills-design` for the full format guide if needed. NON-NEGOTIABLE.
3. **Write skill.json `description`** — A concise summary (under 200 chars) optimized for registry search.
4. **Suggest `keywords`** — Propose canonical slugs based on the skill's content. Use AskUserQuestion to confirm.
5. **Re-evaluate dependencies (MANDATORY scan, not best-effort)** — The original skill's dependencies were cleared. Scan SKILL.md and every file under `scripts/` for command invocations and declare every remaining binary in `systemDependencies`. Re-add any HappySkills skill dependencies referenced by the SKILL.md.
6. **Prompt for optional fields** — Run the **Optional Fields Prompt** procedure.
7. **Confirm invocation model** — Check whether the forked SKILL.md has `disable-model-invocation: true`. If it does, run the **Invocation Model Confirmation** procedure. For forked skills, the action is "remove the flag."
8. **Initialize CHANGELOG.md** — Create one with a `0.1.0` entry noting it was forked from the original (include `forked_from` info).
9. **Run validation** — Run `npx happyskills validate <skill-name> --json`. If `data.valid` is `false`, fix all errors. Present warnings to the user. This ensures the forked skill is in a valid state before the user starts modifying it.

---

## Skill Release Workflow

When the user wants to release/ship a skill update, run this end-to-end pipeline. This is different from a bare `publish` command — release is the intelligent, full-lifecycle process.

**Always invoke this workflow when releasing — including when releasing the `happyskills` skill family itself.** Do not improvise an ad-hoc release by hand-editing `skill.json` to bump the version, hand-writing a CHANGELOG entry, and then calling `publish` directly. Each of those steps has a dedicated tool (`bump`, `validate`, `publish`) and the workflow orders them correctly (validate before bump, re-validate after CHANGELOG edits, publish last). When you skip the workflow you skip the safeguards — most commonly you'll discover a validation failure *after* bumping, leaving the version and changelog in a state needing a follow-up patch release to clean up. The constraint at SKILL.md "NEVER modify files directly for CLI package management operations" applies here: bumping a version IS a package management operation.

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

**4. Pre-release validation (MANDATORY)**

Before bumping, run `npx happyskills validate <skill-name> --json` to verify the skill is publish-ready. This checks all rules deterministically: SKILL.md existence, frontmatter fields (name, description, optional fields), line count, skill.json fields (name, version, description, keywords, dependencies, systemDependencies), cross-file name consistency, and executable code detection.

- If `data.valid` is `false` → fix all errors before proceeding (Section 11 of SKILL.md).
- If `data.valid` is `true` but there are warnings → present them to the user. Warnings are advisory.
- Additionally review content quality manually: the SKILL.md `description` should follow the canonical format (`<Namespace> — <verb-led action>. Use when <context>. Not for <redirect>.`), be specific (not a placeholder), and stay within the target length (80-180 chars). If validate emitted a `soft_cap` warning (description above 250 chars), the skill is likely a mega-skill — route the user to `happyskills-design` for the audit/decompose decision before releasing.

**If validation fixes modified skill files** (e.g., refactoring SKILL.md to reduce line count, rewriting the description, extracting content to references), those fixes are additional changes that MUST be handled:
- **Record what changed** — Note which files were modified and what was done.
- **Re-evaluate the bump type** — Return to step 3 and reconsider. The original bump type typically still applies since validation fixes are corrective; however, if the fix involved significant structural refactoring, consider whether the bump should be elevated.
- **Include fixes in CHANGELOG** — In step 6, document both the original changes AND the validation fixes (typically under `### Fixed` or `### Changed`).
- **Re-run validation** — After fixing, always re-run `npx happyskills validate` to confirm the fix resolved the error without introducing new ones. Repeat this cycle until validation passes cleanly.

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

Only include the groups that have entries. If `CHANGELOG.md` does not exist, create it with the `# Changelog` heading and the new entry.

**7. Resolve workspace and publish**

First, run the **Workspace Resolution** procedure above.

Show a summary of what will be published:
- Skill name and workspace
- Version: old → new
- Changes (from changelog entry)

Use AskUserQuestion for final confirmation. Do NOT ask about visibility — this is an update to an existing skill, so the server preserves the existing visibility automatically. Then run (ALWAYS include `--workspace`):

```bash
npx happyskills publish <skill-name> --workspace <slug> --json
```

Parse and present the result: "Published owner/name@X.Y.Z to the registry."
