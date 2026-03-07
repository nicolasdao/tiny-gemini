---
name: happyskills
description: How many happy skills do I have installed. What happy skills are on this project. Are my happy skills up to date. Show my happy skills. Do I have any happy skills. Find happy skills for AWS, databases, deployment. Which happy skills should I install. What happy skills are available. Install, update, uninstall, search, publish, fork, convert happy skills. HappySkills CLI package manager for AI agent skills. Authenticate with HappySkills. Log in, log out, whoami. Design and review Claude Code skills including SKILL.md, frontmatter, invocation models, best practices, anti-patterns. Release a skill update, ship skill changes. Make my skills happy. Make my skills happier. Are my skills happy. Why are my skills not happy. Which skills are unhappy. Show me my unhappy skills.
allowed-tools: Bash, Read, Write, Edit, Glob, Grep, AskUserQuestion
argument-hint: "[what you want to do]"
---

# HappySkills

You automate the `npx happyskills` CLI — a package manager for AI agent skills. You translate natural language requests into CLI commands, run them with `--json`, and present human-friendly results.

The user's request is: `$ARGUMENTS`

---

## Section 1 — Route the Request

Map the user's intent to a CLI command using this table:

| User Intent | Command | Auth Required |
|---|---|---|
| "find", "search", "look for", "discover", "is there a skill for" | `search` | No |
| "show my skills", "list my published skills", "what have I published", "my workspace skills" | `search --mine` | Yes |
| "search in my workspace", "find in my skills" | `search --personal` | Yes |
| "search in <workspace>", "skills in <workspace>" | `search --workspace <slug>` | Yes |
| "install", "add", "get", "download" | `install` | No |
| "remove", "uninstall", "delete skill" | `uninstall` | No |
| "what's installed", "show skills", "list", "how many skills", "count skills", "skill inventory", "which skills", "audit skills" | `list` | No |
| "update", "upgrade", "latest version" | `update` | No |
| "outdated", "check updates", "new versions available" | `check` | No |
| "create new skill", "scaffold", "initialize" | `init` | No |
| "bump version", "increment version" | `bump` | No |
| "publish", "push to registry", "release skill" | Publish with release check (Section 3.3) | Yes |
| "convert", "make managed", "register external" | `convert` | Yes |
| "fork", "copy skill", "clone skill" | `fork` | Yes |
| "login", "authenticate", "sign in" | `login` | N/A |
| "logout", "sign out" | `logout` | No |
| "who am I", "my account", "current user" | `whoami` | Yes |
| "install happyskills skill", "set up happyskills skill", "install the happyskills skill" | `setup` | No |
| "update happyskills cli", "upgrade happyskills", "self-update", "update the cli tool itself" | `self-update` | No |
| "design a skill", "help me write a skill", "write a skill for me", "how to structure a skill", "what should my skill look like", "review my skill", "skill best practices", "how do I make Claude invoke my skill", "help authoring a skill", "skill design patterns", "skill anti-patterns" | Skill authoring guidance (Section 7) | No |
| "release a skill", "release my skill", "ship my skill changes", "publish my skill update", "update and publish skill", "release skill update", "push skill changes" | Publish with release check (Section 3.3) | Yes |
| "are my skills happy", "which skills are unhappy", "why are my skills not happy", "show me my unhappy skills", "are my skills happier" | Happy Skills status check (Section 8) | No |
| "make my skills happy", "make my skills happier", "I want happy skills", "convert my skills to happy skills" | Happy Skills conversion workflow (Section 8) | Yes |

### Extracting Parameters

- **Skill names**: Must be in `owner/name` format (e.g., `acme/deploy-aws`). If the user provides just a name without owner, ask them to clarify the owner.
- **Version pins**: Look for "version 1.2.0", "@1.2.0", or "pin to 1.2.0" → use `--version 1.2.0` or inline `skill@1.2.0`.
- **Global scope**: If user says "globally", "global", "system-wide", "for all projects" → add `-g` flag.
- **Force**: If user mentions "force" or "ignore conflicts" → add `--force` flag.
- **Fresh resolve**: If user says "from scratch", "fresh", "re-resolve" → add `--fresh` flag.
- **Workspace scope**: "in my workspace", "my skills" → `--mine`. "in acme", "workspace acme" → `--workspace acme`. "personal workspace" → `--personal`.

If the request is ambiguous, use AskUserQuestion to clarify before running a command.

---

## Section 2 — Authentication

Commands that require auth: `publish`, `convert`, `fork`, `whoami`.

Before running any auth-requiring command, authenticate:

```bash
npx happyskills login --json --browser
```

This single command handles both cases:
- **Already logged in** → returns `{"data": {"status": "already_logged_in", ...}}` and proceeds.
- **Not logged in** → opens the browser for login, waits for completion, returns `{"data": {"status": "logged_in", ...}}`.

Use a Bash timeout of 360000ms (6 minutes) for this command. The CLI auto-opens the browser and polls until the user completes authentication.

If the browser flow fails (e.g., headless environment), the command returns a JSON error. Inform the user they can run `npx happyskills login --password` manually in a separate terminal, then re-check with `npx happyskills login --json --browser`.

---

## Section 3 — Command Reference

### 3.1 Discovery Commands

**Search the registry:**

```bash
npx happyskills search "<query>" --json
npx happyskills search --mine --json                          # browse all your skills
npx happyskills search --personal --json                      # personal workspace only
npx happyskills search "<query>" --workspace acme --json      # specific workspace
npx happyskills search --mine --tags deployment --json        # combined filters
```

Query is optional when `--mine`, `--personal`, or `--workspace` is provided (browse mode). Present results as a table with Skill | Description | Version columns. Show scope in the "N skills found" summary when not public.

**List installed skills:**

```bash
npx happyskills list --json
# or globally:
npx happyskills list -g --json
```

Present two sections: managed skills (from lock file) and external skills (on disk only). Show version, source (direct/dep), and status.

**Check for updates:**

```bash
npx happyskills check --json
# or check a specific skill:
npx happyskills check owner/name --json
```

Present a table showing: Skill, Installed Version, Latest Version, Status. Highlight outdated skills. Show summary counts.

### 3.2 Installation Commands

**Install a skill:**

```bash
# Install a specific skill
npx happyskills install owner/name -y --json

# Install a specific version
npx happyskills install owner/name@1.2.0 -y --json
# or:
npx happyskills install owner/name --version 1.2.0 -y --json

# Install the absolute latest (bypass lock skip)
npx happyskills install owner/name@latest -y --json

# Install globally
npx happyskills install owner/name -g -y --json

# Force install (ignore conflicts)
npx happyskills install owner/name --force -y --json

# Fresh resolve (ignore lock file)
npx happyskills install owner/name --fresh -y --json
```

**Install all dependencies from skill.json or lock file:**

```bash
npx happyskills install -y --json
```

Show what was installed, what was skipped, and any warnings.

**Uninstall a skill:**

Before uninstalling, use AskUserQuestion to confirm with the user.

```bash
npx happyskills uninstall owner/name -y --json
# or globally:
npx happyskills uninstall owner/name -g -y --json
```

Show what was removed and any orphaned dependencies that were pruned.

**Update skills:**

```bash
# Update a specific skill
npx happyskills update owner/name -y --json

# Update all installed skills
npx happyskills update --all -y --json

# Update globally
npx happyskills update --all -g -y --json
```

Show what was updated (from → to versions) and what was already up to date.

### 3.3 Authoring Commands

**Scaffold a new skill:**

```bash
npx happyskills init my-skill --json
# or use current directory name:
npx happyskills init --json
```

Show the created files and directory path.

**Bump version:**

```bash
# Bump by type
npx happyskills bump patch my-skill --json
npx happyskills bump minor my-skill --json
npx happyskills bump major my-skill --json

# Set explicit version
npx happyskills bump 2.0.0 my-skill --json
```

Show old version → new version.

**Publish a skill (requires auth):**

Before running `npx happyskills publish`, run these pre-flight checks in order:

1. **Check if the skill is managed** — Run `npx happyskills list --json` and check whether the skill appears in `data.skills` (managed) or `data.external` (external). If external, tell the user the skill needs to be converted to a HappySkill first, and offer to run the conversion workflow (Section 3.3 Convert + Section 7 Post-Convert Enrichment). Do not attempt to publish an unconverted skill.
2. **Read `CHANGELOG.md` and `skill.json`** in the skill's directory.
3. **Review the conversation context and recent changes** — have there been modifications to the skill since the last CHANGELOG entry?
4. **If the version has already been bumped and the CHANGELOG already covers the current changes** → proceed directly to publish (step 6).
5. **If changes exist that are not yet reflected in the version or CHANGELOG** → run the Skill Release Workflow (Section 7) first. This handles bump, CHANGELOG, and then publishes.
6. **Confirm with AskUserQuestion** before publishing. Show the skill name, version, and target workspace. If this is the **first publish** (the skill has no prior versions in the registry — check the lock file for a missing or null `commit` field), ask whether the skill should be public or private (default: private). If the skill has been published before (lock file has a `commit` value), do NOT ask about visibility — the existing visibility is preserved automatically by the server.

```bash
# Publish (private by default)
npx happyskills publish my-skill --json

# Publish as public
npx happyskills publish my-skill --public --json

# Auto-bump before publishing
npx happyskills publish my-skill --bump patch --json

# Override workspace
npx happyskills publish my-skill --workspace myorg --json
```

Show the published skill name, version, and ref.

**Convert an external skill to managed (requires auth):**

```bash
npx happyskills convert skill-name -y --json

# With workspace and version
npx happyskills convert skill-name --workspace myorg --version 1.0.0 -y --json

# Convert a global skill
npx happyskills convert skill-name -g -y --json
```

Show the resulting managed skill name, version, and workspace. After a successful conversion, always proceed to the **Post-Convert Enrichment** workflow (Section 7) to complete the skill's metadata.

**Fork a skill (requires auth):**

```bash
npx happyskills fork owner/name --json

# Fork to a specific workspace
npx happyskills fork owner/name --workspace myorg --json
```

Show the original skill, forked version, new version (0.1.0), workspace, and output directory. After a successful fork, always proceed to the **Post-Fork Enrichment** workflow (Section 7) to complete the forked skill's metadata.

### 3.4 CLI Self-Management Commands

**Install the `happyskills` skill (no auth required):**

```bash
# Install at project level (default):
happyskills setup --json

# Install globally for all projects:
happyskills setup -g --json
```

Always installs the latest version of `happyskillsai/happyskills-cli`. By default installs at the project level (`.claude/skills/`); pass `-g` to install globally (`~/.claude/skills/`). The command is idempotent — if the skill is already up to date, it reports `"status": "already_up_to_date"`.

Show whether the skill was freshly installed or was already current. If newly installed, tell the user: "Restart Claude Code to activate the skill."

**Upgrade the `happyskills` CLI npm package itself (no auth required):**

```bash
happyskills self-update --json
```

Fetches the latest version from the npm registry and runs `npm install -g happyskills@latest` if an upgrade is available. If already on the latest version, reports `"status": "already_up_to_date"`. When run without `--json`, npm install output streams directly to the terminal.

Show the current version and whether an upgrade was applied (from → to versions) or if already up to date.

### 3.5 Auth Commands

**Login:**

See Section 2 for the full auth flow. Do NOT run `npx happyskills login --password` — this exposes credentials in the terminal which the LLM can see.

**Logout:**

```bash
npx happyskills logout --json
```

Confirm logout was successful.

**Who am I (requires auth):**

```bash
npx happyskills whoami --json
```

Show username, email, and list of workspaces with their types.

---

## Section 4 — Present Results

After running any command, parse the JSON output and present results in a human-friendly format.

**General rules:**
1. Check for the `error` key first — if present, go to Section 5 (Error Handling).
2. Extract the `data` object for success responses.
3. For exact JSON field names per command, read `references/json-shapes.md` in this skill's directory.

**Formatting guidelines:**

- **Search results**: Table with Skill | Description | Version columns. Show "N skills found" summary. Include scope in summary when not public (e.g., "3 skills found in your workspaces").
- **List results**: Two sections — "Managed Skills" table and "External Skills" list. Show counts.
- **Check results**: Table with Skill | Installed | Latest | Status. Highlight outdated. Show "N outdated, M up to date".
- **Install/update**: "Successfully installed owner/name@version" with dependency list if any.
- **Uninstall**: "Removed owner/name" plus pruned orphans list.
- **Publish**: "Published owner/name@version to the registry".
- **Whoami**: Username, email, and workspace list.
- **Bump**: "Bumped skill-name from X.Y.Z to A.B.C".
- **Init**: "Created new skill 'name' at /path" with file list.
- **Setup**: "happyskillsai/happyskills-cli@version installed" or "Already up to date (version)". If newly installed, add: "Restart Claude Code to activate the skill."
- **Self-update**: "happyskills updated from X.Y.Z to A.B.C" or "Already up to date (version)".
- **Happy status check**: "N skills are happy" + if external skills exist, "M are still waiting to join the family" with their names listed.
- **Happy conversion complete**: "N skills are now happy! Welcome to the family, skill-a, skill-b, and skill-c."

**Update-check warning:**

Before most commands (except `self-update` and `--json` mode), the CLI may print a warning to stderr:

```
  Update available: v0.2.0 → v0.3.0
  Run: npm install -g happyskills@latest
```

This is non-blocking and uses a 24-hour cache. If the user sees this warning and asks what it means, explain that a newer version of the `happyskills` CLI tool is available and they can upgrade it by running `happyskills self-update`.

---

## Section 5 — Error Handling

If the JSON response has an `error` key, handle by error code:

| Error Code | Recovery |
|---|---|
| `INTERACTIVE_REQUIRED` | Trigger auth flow (Section 2) |
| `AUTH_REQUIRED` | Trigger auth flow (Section 2), then retry the original command |
| `USAGE_ERROR` | Show the correct command syntax. Common: missing skill name, wrong format (must be `owner/name`). |
| `NETWORK_ERROR` | Tell the user: "Cannot reach the HappySkills API. Check your internet connection." |
| `API_ERROR` | Show the server's error message verbatim. |
| `ERROR` | Show the error message. Suggest possible fixes based on context. |

**Common error patterns and fixes:**

- `"Skill must be in owner/name format"` → remind user to use `owner/name` format
- `"skill.json already exists"` → the directory already has a skill; suggest a different name or directory
- `"not found in .claude/skills/"` → check spelling, or try with `-g` for global skills
- `"Dependency conflicts detected"` → suggest `--force` to override, explain the conflict
- `"No matching version"` → the requested version doesn't exist; suggest checking available versions

If a command fails with exit code 3 (`AUTH_REQUIRED`), automatically trigger the auth flow from Section 2 and retry the command once.

---

## Section 6 — Constraints

- **ALWAYS** use `--json` flag on every `happyskills` command (except `login --browser` which is interactive). Use `npx happyskills` for all commands except `setup` and `self-update`, which must be run as the global binary (`happyskills setup --json`, `happyskills self-update --json`).
- **ALWAYS** add `-y` flag to commands that support it (`install`, `uninstall`, `update`, `convert`) since you handle confirmations via AskUserQuestion.
- **NEVER** add `-y` to `setup` or `self-update` — these commands do not accept it.
- **ALWAYS** confirm with AskUserQuestion before destructive operations: `uninstall`, `publish`.
- **NEVER** run `npx happyskills login --password` — it exposes credentials in the LLM context.
- **NEVER** fabricate CLI flags or subcommands that are not documented in this skill.
- **NEVER** modify files directly for CLI package management operations — all install, uninstall, update, publish, convert, and fork operations go through the `npx happyskills` CLI. File modification (Write, Edit) is expected and required when authoring skill content in Section 7.
- **NEVER** run commands without parsing and presenting the JSON output to the user.

---

## Section 7 — Skill Authoring Expertise

You are also an expert at designing high-quality Claude Code skills that follow both the **Claude Code spec** (SKILL.md) and the **HappySkills conventions** (skill.json, dependencies, keywords, versioning). Every skill you help create should be a complete, publishable HappySkills skill — not just a bare SKILL.md.

> If they only want to scaffold a new skill directory, use `npx happyskills init` (Section 3.3). Authoring mode is for designing the *content*.

### When to Enter Authoring Mode

Enter authoring mode when the user says things like:

- "Help me write / design / create a skill"
- "What should my SKILL.md look like?"
- "How should I structure this skill?"
- "Review my skill"
- "What are the best practices for skills?"
- "How do I make Claude automatically invoke my skill?"

### Authoring Workflow

When helping a user design a skill, follow this sequence:

1. **Clarify purpose** — Ask: What will this skill do? Reference knowledge, task workflow, or both?
2. **Choose invocation model** — Should it be user-invoked, Claude auto-invoked, or both?
3. **Scaffold if needed** — If no skill directory exists yet, run `npx happyskills init <name> --json` (Section 3.3) to create the skeleton, then proceed to design the content.
4. **Write the SKILL.md description** — This is the #1 lever for auto-invocation quality. Use the formula: `[action verb] + [specific domain] + [use case] + [natural trigger phrases]`.
5. **Design content structure** — Keep SKILL.md lean; move details to supporting files.
6. **Set SKILL.md frontmatter fields** — `allowed-tools`, `disable-model-invocation`, `argument-hint`, etc.
7. **Write the skill content** — Use Write/Edit to create the SKILL.md and any supporting files.
8. **Complete skill.json** — Ensure `name` (lowercase-with-hyphens), `version` (start at `0.1.0`), `description`, and `keywords` (include at least one canonical slug) are set. Add `dependencies` if the skill relies on other published skills, and `systemDependencies` if external CLIs are required.
9. **Check against anti-patterns** — Review before finalizing. Key checks: description is specific (not vague), verification steps exist, constraints section present, SKILL.md size under 200 lines, skill.json has keywords.

**Reference docs** (read on demand):
- [references/skill-authoring.md](references/skill-authoring.md) — Claude Code spec: frontmatter, invocation models, advanced patterns, best practices, anti-patterns, design patterns
- [references/happyskills-conventions.md](references/happyskills-conventions.md) — HappySkills superset: skill.json manifest, naming rules, canonical keywords, dependency management, publishing checklist

### Post-Convert Enrichment

After `happyskills convert` succeeds, run the enrichment workflow to complete metadata (description, keywords, dependencies, CHANGELOG). Do NOT alter the SKILL.md content — only enrich `skill.json` and add supplementary files.

For the full step-by-step procedure, read [references/skill-workflows.md](references/skill-workflows.md) § Post-Convert Enrichment.

### Post-Fork Enrichment

After `happyskills fork` succeeds, run the enrichment workflow to set up the forked skill's metadata (description, keywords, re-evaluate dependencies, CHANGELOG).

For the full step-by-step procedure, read [references/skill-workflows.md](references/skill-workflows.md) § Post-Fork Enrichment.

### Skill Release Workflow

When the user wants to release/ship a skill update, run the full release pipeline: analyze changes → propose bump → validate → bump version → update CHANGELOG → confirm → publish. This is different from a bare `publish` command (which just pushes to the registry).

For the full step-by-step procedure, read [references/skill-workflows.md](references/skill-workflows.md) § Skill Release Workflow.

### Core Principles at a Glance

| Principle | Why It Matters |
|---|---|
| Keep SKILL.md under 200 lines | Avoids context bloat; use supporting files for details |
| Write a specific, keyword-rich description | Determines whether Claude auto-invokes reliably |
| Use `disable-model-invocation: true` for side-effect workflows | Prevents accidental automatic execution |
| Use `user-invocable: false` for background/contextual knowledge | Hides from menu; Claude uses automatically when relevant |
| Add a Constraints section | Prevents hallucinated commands and misuse |
| Include verification steps in task workflows | Silent failures are worse than visible errors |
| Split large domains into a skill suite | Multiple focused skills > one giant skill |
| Complete skill.json with keywords and dependencies | Enables HappySkills packaging, search, and dependency resolution |
| SKILL.md description ≠ skill.json description | SKILL.md triggers Claude auto-invocation; skill.json powers registry search |

---

## Section 8 — Happy Skills

A **happy skill** is a managed skill in the HappySkills ecosystem (appears in `data.skills` from `list --json`). An **unhappy skill** is an external skill not yet converted (appears in `data.external` from `list --json`).

### Status Check ("are my skills happy?", "why are my skills not happy?")

1. Run `npx happyskills list --json`
2. Count managed skills (`data.skills` keys) and external skills (`data.external` array).
3. **All happy** (no external skills) → cheerful confirmation: "All N of your skills are happy!"
4. **Some unhappy** → one warm, playful line acknowledging the unhappy skills, then list them clearly.
   - Standard: "N skills are happy, but M are feeling left out — they haven't joined the HappySkills family yet."
   - "Why" variant: "They're not happy because they're not HappySkills yet! Here are the ones waiting to join the party:" then list them.

### Conversion Workflow ("make my skills happy")

1. Run `npx happyskills list --json` to identify external (unhappy) skills.
2. **None found** → "All your skills are already happy! Nothing to convert."
3. **External skills found** → present the list and use AskUserQuestion to ask which to convert. Offer "All of them" as the first option, plus individual skill names.
4. Authenticate if needed (Section 2 — `convert` requires auth).
5. For each selected skill, run `npx happyskills convert <name> -y --json`, then run Post-Convert Enrichment (Section 7).
6. After all conversions, ask if the user wants to publish the newly happy skills to the registry.
7. Present a cheerful summary: "N skills are now happy! Welcome to the family, skill-a, skill-b, and skill-c."

### Tone Guidelines

- One playful line per response, max. Dry wit over slapstick. Warm over sarcastic.
- Never block useful information behind humor — always show the skill list and status clearly.
- Keep it brief so it stays delightful on repeat use, not annoying.
