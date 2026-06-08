---
name: create-release-skill
description: Create a release skill for any project. Analyzes a project directory to discover its type and versioning strategy, gathers release requirements through conversation, then generates a tailored release skill with changelog management, semantic versioning, and git integration. Use when setting up release automation, adding release workflows, or creating release skills for monorepo sub-projects.
disable-model-invocation: true
arguments: [project_path, instructions]
argument-hint: "[project-path] [\"custom instructions\"]"
allowed-tools: Bash, Read, Write, Edit, Glob, Grep, AskUserQuestion
---

# Create Release Skill

Generate a tailored release skill for any project by reverse-engineering its type, determining the versioning strategy, and gathering project-specific requirements through conversation.

## Arguments

Both arguments are optional. If omitted, the skill resolves them interactively.

- **$project_path** (optional): Path to the project directory. Can be absolute or relative. If omitted, the skill discovers candidate projects and asks the user to choose.
- **$instructions** (optional): Quoted description of custom release requirements. If omitted, the skill asks whether there are custom requirements.

## Step 0 — Resolve Arguments

If `$project_path` is empty (no arguments passed), resolve it interactively:

1. **Discover candidate projects.** From the current working directory, list immediate subdirectories that look like projects (contain `package.json`, `Cargo.toml`, `pyproject.toml`, `go.mod`, `src/`, `Makefile`, or other project markers from [references/project-types.md](references/project-types.md)). Also include the current working directory itself as a candidate (labeled with its name, e.g., "this directory (ivan/)").
2. **Ask the user to choose.** Use AskUserQuestion to present the discovered candidates as options (max 4 — prioritize the most likely projects). The user can always select "Other" to type a custom path. If only the root directory is detected, still ask to confirm.
3. **Set `$project_path`** to the user's selection.

If `$instructions` is empty AND was not passed as an argument:

4. **Ask about custom requirements.** Use AskUserQuestion: "Are there any specific custom requirements for this release skill (e.g., deployment steps, pre-release checks, notifications)?"
   - **"No, standard release is fine"** — proceed with no custom instructions
   - **"Yes, I have specific requirements"** — ask the user to describe them, then use their response as the starting context for Phase 2

## Pre-flight Checks

Verify these hard requirements before anything else. If any fail, stop and show the user how to fix it.

1. **Node.js and npx**: Run `npx --version`. If it fails, tell the user to install Node.js 18+.
2. **HappySkills CLI**: Run `npx happyskills --version`. If it fails, tell the user to run `npx happyskills setup`.
3. **HappySkills skill**: Search for the HappySkills SKILL.md in these locations (check in order, stop at first match):
   - `.agents/skills/happyskills/SKILL.md` (project-level)
   - `~/.agents/skills/happyskills/SKILL.md` (global)
   - `.claude/skills/happyskills/SKILL.md` (project-level, Claude convention)
   - `~/.claude/skills/happyskills/SKILL.md` (global, Claude convention)
   If not found, tell the user to run `npx happyskills setup`.
   Record the located path — it will be needed in Phase 3 for reading skill-authoring best practices.
4. **Project path**: Verify `$project_path` exists and is a directory. (Already resolved in Step 0 if it was empty.)
5. **Git**: Run `git --version`. Git is a hard requirement for all release skills.

## Phase 1 — Project Discovery

Analyze the project at `$project_path` to determine its type, versioning, and repository context.

### 1.1 Project Type and Version Management

Scan the project root for markers that identify the project type and where versions are managed. Read [references/project-types.md](references/project-types.md) for the complete discovery table.

Key outcomes:
- **Project type** (Node.js, Python, Rust, Go, documentation, etc.)
- **Version file** and how to read/write it
- **Fallback**: If no convention exists, use a plain `VERSION` file in the project root

### 1.2 Repository Context

Determine from git:
- **Monorepo detection**: Is `$project_path` a subdirectory of the git root? (`git rev-parse --show-toplevel`)
- **Tag format**: Monorepo sub-project uses `<project-name>-v<version>` (e.g., `frontend-v1.2.0`). Standalone uses `v<version>`.
- **Project name**: Derive from directory name or package manifest `name` field.

### 1.3 Documentation and Existing Release Process Discovery

Scan the project for documentation and artifacts that describe existing release processes. This is critical — the generated skill must not break established workflows, and discovered information reduces the back-and-forth needed in Phase 2.

**Files to scan (read if they exist):**

| File/Location | What to look for |
|---|---|
| `README.md`, `README.rst` | Release/deployment sections, build instructions, contributing guidelines |
| `CONTRIBUTING.md` | Release workflow, versioning policy, commit conventions |
| `CHANGELOG.md` | Existing format and conventions (to preserve, not override) |
| `docs/` directory | Files with "release", "deploy", "development", "contributing" in the name |
| `CLAUDE.md`, `.claude/` | AI-specific project instructions that may reference release processes |
| Package manifest scripts | `package.json` "scripts" (look for "release", "deploy", "version", "publish"), `Makefile`/`justfile`/`Taskfile.yml` targets |
| `scripts/` directory | Files with "release", "deploy", "version", "publish", "bump" in the name |
| `.github/workflows/` | CI/CD pipelines that may run on tags or releases |
| `.gitlab-ci.yml`, `Jenkinsfile` | CI/CD definitions with release stages |

**How to scan efficiently:**
- Do NOT read every file end-to-end. Use Grep to search for keywords: "release", "deploy", "version", "publish", "tag", "changelog", "bump"
- Read only the relevant sections of files that match
- For `docs/`, list filenames first, then read only those that look release-related

**Key outcomes:**
- **Existing release scripts** — if the project already has release automation (e.g., `npm run release`, `make release`, a CI pipeline triggered by tags), document them. The generated skill should integrate with these, not replace them.
- **Deployment process** — how the project gets to production (if documented). Pre-populates the post-release actions topic in Phase 2.
- **Existing conventions** — commit message format, changelog style, versioning policy. The generated skill should respect these.
- **CI/CD integration** — if pushing a tag triggers a pipeline, the generated skill must know this to avoid redundant steps or to include the push as a release step.

### 1.4 Present Discovery Summary

Show the user:
- Project type detected
- Version file location and current version (or "will create VERSION file")
- Monorepo vs standalone
- Tag format that will be used
- Changelog location: `CHANGELOG.md` in project root (always)
- **Existing release process** (if discovered) — summarize what was found and highlight anything the generated skill should integrate with or preserve
- **Documentation gaps** — if no release documentation was found, note this

Use AskUserQuestion to confirm or correct the discovery results before proceeding.

## Phase 2 — Requirements Gathering

Engage in conversation to gather all project-specific release requirements.

### 2.1 Starting Context

If `$instructions` was provided, acknowledge what the user described and ask clarifying questions about anything ambiguous.

If `$instructions` was not provided, explain that you will ask a few questions to understand how releases should work for this project.

### 2.2 Topics to Cover

At minimum, discuss these (some may already be answered by `$instructions`):

1. **Invocation preference** — Ask with AskUserQuestion: "Should Claude be able to auto-invoke this release skill when you ask to release, ship, or cut a version? Or should it only respond to the /slash command?"
   - **"Auto-invoke (Recommended)"** — Claude triggers when the conversation matches (e.g., "release the frontend", "ship a new version", "cut a release"). Safe because the skill always confirms before any irreversible action.
   - **"User-only (/slash command)"** — Only manual `/release-<name>` invocation. Claude will not know the skill exists. Choose this only if accidental triggering is a concern.
   Record the choice — it determines `disable-model-invocation` in frontmatter and how the description must be crafted in Phase 3.
2. **Pre-flight checks** — Should tests pass before releasing? Must the build succeed? Any other gates?
3. **Related paths** — In a monorepo, are there related directories to check for uncommitted changes? (e.g., database migrations that accompany API changes)
4. **Post-release actions** — What happens after version bump + changelog + commit + tag?
   - Just commit and tag (user handles the rest)
   - Push to remote (`git push && git push --tags`)
   - Deploy (how — Pulumi, Vercel, npm publish, Docker, etc.)
   - Other custom steps
5. **Blast radius** — Are there cross-project dependencies or side effects to verify before releasing?
6. **Custom steps** — Anything else specific to this project (scripts, notifications, docs updates, etc.)

### 2.3 Conversation Guidelines

- Ask focused questions, one topic at a time
- Offer concrete options via AskUserQuestion when possible
- If the user says "that's it" or "nothing else", stop asking and move on
- Do NOT over-ask — respect the user's signal that requirements are complete

### 2.4 Final Confirmation

Present a complete summary of everything that will go into the generated skill:
- Project type and version management strategy
- Invocation preference (auto-invoke or user-only)
- All release steps in order
- Mode A/B/C support (always included)
- Arguments: `[action, note]` (always included)
- Pre-flight checks
- Post-release actions (if any)

Use AskUserQuestion for final confirmation before generating.

## Phase 3 — Skill Generation

### 3.1 Determine Skill Name

Derive from the project: `release-<project-name>` (e.g., `release-frontend`, `release-web-apis`). Confirm with the user via AskUserQuestion.

### 3.2 Scaffold with HappySkills

Run `npx happyskills init` from the **project root directory** (the directory containing `.agents/` and/or `.claude/`). Never run it from inside `.agents/skills/`, `.claude/skills/`, or any subdirectory.

```bash
npx happyskills init <skill-name>
```

#### 3.2.1 Verify Scaffold Location

After `happyskills init` completes, verify the output landed correctly:

1. The skill directory exists at `.agents/skills/<skill-name>/` (the canonical location)
2. A symlink exists at `.claude/skills/<skill-name>` pointing to `../../.agents/skills/<skill-name>`
3. The symlink is relative, not absolute (check with `ls -la .claude/skills/<skill-name>`)

If any check fails, the init was run from the wrong directory. Delete the incorrectly placed files and re-run from the project root.

### 3.3 Read Skill-Authoring Best Practices

Before writing any content, read the HappySkills skill-authoring reference located during pre-flight:

```
<happyskills-path>/references/skill-authoring.md
```

Follow all best practices from that reference when generating the skill. Key rules:
- SKILL.md under 500 lines — use `references/` for detailed content if needed
- Keyword-rich description with trigger-phrase resilience
- No forbidden characters in frontmatter values
- Include a Constraints section
- Include verification steps after actions
- All executable code in `scripts/`, never embedded in markdown
- Conditional file references ("read X if Y happens")

### 3.4 Core Behaviors

Every generated release skill MUST implement the behaviors defined in [references/release-skill-spec.md](references/release-skill-spec.md). This includes:

1. Pre-flight check (clean working directory — hard gate)
2. Mode detection (A/B/C based on session context and $action)
3. Change analysis (session context + git log + diffs + existing [Unreleased] notes)
4. Change classification (Keep a Changelog categories)
5. Bump determination (patch/minor/major or "nothing worth releasing")
6. Changelog update (CHANGELOG.md in project root, Keep a Changelog format)
7. Version bump (update the version file)
8. Git commit (conventional message: `chore(release): <project> v<version>`)
9. Git tag (annotated, format per monorepo/standalone detection)
10. User confirmation before irreversible actions

### 3.5 Craft the Description

The quality of the generated skill's `description` depends on the invocation preference chosen in Phase 2.

**If auto-invoke**: The description is the sole trigger signal for Claude. It must be keyword-rich and cover multiple phrasing families so Claude matches reliably. Include:
- Action verbs: "Release", "Ship", "Cut a version", "Tag a release"
- Project-specific nouns: the project name, type, and domain
- Phrasing variations: imperative ("release the frontend"), question ("can you release?"), past tense ("I released the API"), noun-phrase ("frontend release"), progressive ("releasing the web app")
- Use case context: "after finishing features or fixes", "when ready to ship", "to bump version and update changelog"

**If user-only**: The description still needs to be clear (it appears in `skill.json` for registry search), but trigger-phrase resilience is not required since Claude will never see it for auto-invocation.

### 3.6 Write the Files

1. Write `SKILL.md` with frontmatter (`arguments: [action, note]`, proper description, allowed-tools, and `disable-model-invocation: true` ONLY if the user chose user-only in Phase 2)
2. Update `skill.json` with description, keywords, and systemDependencies
3. Create supporting files in `references/` if the skill exceeds ~300 lines
4. If the project has custom release scripts, place them in `scripts/` and reference via `${CLAUDE_SKILL_DIR}/scripts/`

### 3.6 Validate

Run validation:

```bash
npx happyskills validate <skill-name>
```

Fix any issues reported by the validator.

## Phase 4 — Handoff

After successful generation:

1. Show the complete generated SKILL.md content
2. Show the file structure created (tree view)
3. Explain how to invoke: `/release-<project-name>`, `/release-<project-name> draft`, `/release-<project-name> minor "Added feature X"`
4. Remind about Mode C: "Use `draft` to capture release notes mid-session without doing a full release"

## Constraints

- NEVER generate a release skill without completing all three phases (discovery, requirements, generation)
- NEVER skip pre-flight checks
- NEVER assume project type without scanning — always verify by reading actual files
- NEVER create a release skill that modifies files outside the target project directory
- NEVER include secrets, credentials, or environment-specific values in generated skills
- NEVER embed absolute paths in generated skills — all paths must be relative (to the project root, git root, or use `${CLAUDE_SKILL_DIR}` for skill-bundled files). Absolute paths break portability across machines and users
- NEVER skip user confirmation before generating the final skill
- ALWAYS run `npx happyskills init` from the project root to scaffold — never from inside `.agents/skills/` or `.claude/skills/`. Skills are created in `.agents/skills/` and symlinked to `.claude/skills/` — never write directly to `.claude/skills/`
- ALWAYS verify after scaffolding that the canonical directory is in `.agents/skills/` and symlinks are relative
- ALWAYS follow HappySkills best practices from the skill-authoring reference
- ALWAYS ask the user about invocation preference during Phase 2 — never assume user-only or auto-invoke without asking
- ALWAYS include Mode A, B, and C support in every generated skill
- If the project has no previous releases (no tags, no CHANGELOG.md), the generated skill should start at version 0.1.0 for the first release
