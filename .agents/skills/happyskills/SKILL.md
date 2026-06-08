---
name: happyskills
description: HappySkills — Install and update AI agent skills. Use when adding a skill to a project, listing installed skills, refreshing or removing them, signing in, or configuring HappySkills. Not for searching the registry or asking questions.
allowed-tools: Bash, Read, Write, Edit, Glob, Grep, AskUserQuestion
argument-hint: "[your install/lifecycle request]"
---

# HappySkills (Core)

You manage the local lifecycle of AI agent skills — install, list, update, uninstall, enable/disable, configure agents, sign in. You are the entry point for the HappySkills skill family. Other family members handle search and Q&A (`happyskills-help`), skill design (`happyskills-design`), publishing (`happyskills-publish`), sync (`happyskills-sync`), and workspace collaboration (`happyskills-collab`, opt-in).

The user's request is: `$ARGUMENTS`

---

## Section 1 — Route the Request

| User Intent | Command |
|---|---|
| "install", "add", "get", "download" (skill name) | `install` (Section 3) |
| "install all dependencies", "install from manifest" | `install` no-arg |
| "remove", "uninstall", "delete skill" (skill name) | `uninstall` (Section 3) |
| "list", "show", "what's installed", "how many skills", "count skills", "skill inventory", "which skills do I have" | `list` |
| "update", "upgrade", "latest version", "refresh my skills", "are my skills up to date, update them" | `update --all` (smart by default) |
| "outdated", "check updates", "new versions available" | `check` |
| "force re-install all", "redownload everything", "fresh install" | `update --all --force` |
| "login", "authenticate", "sign in" | `login` (Section 2) |
| "logout", "sign out" | `logout` |
| "who am I", "my account", "current user", "what workspaces do I have" | `whoami` |
| "install happyskills skill", "set up happyskills skill" | `setup` |
| "update happyskills cli", "upgrade happyskills", "self-update" | `self-update` |
| "configure", "settings", "set default agents", "show config", "change config", "default agents" | `config` (Section 4) |
| "enable", "activate", "turn on", "re-enable" (skill name) | `enable` |
| "disable", "deactivate", "turn off", "hide skill", "too many skills", "reduce context" (skill name) | `disable` |
| "are my skills happy", "which skills are unhappy", "why are my skills not happy" | Happy Status check (Section 5) |
| "make my skills happy", "convert my skills to happy skills" | Route to `happyskills-publish` (Section 5) |

**Disambiguation rules — what NOT to handle here:**

- "find / search / recommend skills" → owned by `happyskills-help` (concierge). Route: "Say 'find me a skill for X' and the concierge will search the registry."
- "publish / release / bump / validate / convert / fork / delete / visibility" → owned by `happyskills-publish`. Route: "Say 'publish my skill' and the publish skill will handle it."
- "design / audit / scaffold / review / update this skill content / improve this skill" → owned by `happyskills-design`. Route accordingly.
- "status / pull / diff / merge conflict / why can't I publish / diverged" → owned by `happyskills-sync`. Route accordingly.
- "people / groups / access / invite / grant access" → owned by `happyskills-collab` (opt-in). If not installed, route to concierge ("say 'how do I invite someone' and the concierge will help install collab").

For exact CLI syntax and JSON response shapes, read [references/cli-reference.md](references/cli-reference.md). For multi-agent details, read [references/multi-agent.md](references/multi-agent.md). For the Happy Skills metaphor, read [references/happy-skills.md](references/happy-skills.md).

---

## Section 2 — Authentication

Most lifecycle commands don't require auth. `whoami` does.

Before running any auth-requiring command, authenticate:

```bash
npx happyskills login --json --browser
```

Use a Bash timeout of 360000ms (6 minutes). The CLI auto-opens the browser. Single command handles both checking and authenticating:
- Already logged in → returns `{"data": {"status": "already_logged_in", ...}}` and proceeds.
- Not logged in → opens browser, returns `{"data": {"status": "logged_in", ...}}` after approval.

If the browser flow fails (headless environment), tell the user to run `npx happyskills login --password` manually in a separate terminal, then re-check.

If a command fails with exit code 3 (`AUTH_REQUIRED`), trigger the auth flow and retry once.

---

## Section 3 — Command Quick Reference

For exact syntax, all flags, and JSON shapes, read [references/cli-reference.md](references/cli-reference.md). Quick syntax for common operations:

| Action | Command |
|---|---|
| Install (single or batched) | `npx happyskills install owner/a [owner/b ...] -y --json` |
| Install with version | `npx happyskills install owner/name@1.2.0 -y --json` |
| Install globally | `npx happyskills install owner/name -g -y --json` |
| Install from manifest | `npx happyskills install -y --json` |
| Uninstall | `npx happyskills uninstall owner/a [owner/b ...] -y --json` |
| List installed skills | `npx happyskills list --json` |
| Check updates | `npx happyskills check --json` |
| Update all (smart — checks first) | `npx happyskills update --all -y --json` |
| Force re-install all | `npx happyskills update --all --force -y --json` |
| Enable | `npx happyskills enable <skill> [skill2 ...] --json` |
| Disable | `npx happyskills disable <skill> [skill2 ...] --json` |
| Login | `npx happyskills login --json --browser` |
| Logout | `npx happyskills logout --json` |
| Whoami | `npx happyskills whoami --json` |
| Setup (install happyskills skill) | `happyskills setup --json` |
| Self-update (CLI npm package) | `happyskills self-update --json` |
| Config (view) | `npx happyskills config --json` |
| Config agents (set) | `npx happyskills config agents claude,cursor --json` |
| Config agents (list) | `npx happyskills config agents --list --json` |

---

## Section 4 — Multi-Agent Configuration

HappySkills supports 8 AI agents (Claude Code, Cursor, Windsurf, Codex, GitHub Copilot, Aider, Cline, Roo Code). Auto-detected by default. Physical files always live in `.agents/skills/` (project) or `~/.agents/skills/` (global) — every agent gets a symlink.

For full multi-agent details (supported agents, symlink mechanics, `--agents` flag, env var, fallback behavior), read [references/multi-agent.md](references/multi-agent.md).

Quick reference:
- Auto-detect: omit `--agents` flag (default)
- Specific agents: `--agents claude,cursor`
- Set permanent default: `npx happyskills config agents claude,cursor --json`
- Reset to auto-detect: `npx happyskills config agents --reset --json`
- List all agents: `npx happyskills config agents --list --json`

When a user asks "which agents are supported" or "how does multi-agent work" — that's a Q&A question, route to `happyskills-help` ("say 'which agents does HappySkills support' and the concierge will answer"). Core handles the *configuration commands*; the concierge handles the *explanations*.

---

## Section 5 — Happy Skills

The "happy" metaphor is a friendly status check on the user's installed skill inventory:
- **Happy skill** = managed (in HappySkills lock file).
- **Unhappy skill** = external (on disk only, not converted).

| User Intent | Action |
|---|---|
| "are my skills happy?", "why are my skills not happy?" | Run `list --json`, count managed vs external, present a warm summary. See [references/happy-skills.md § Status Check](references/happy-skills.md). |
| "make my skills happy", "make my skills happier", "convert my skills to happy skills" | Identify external skills (`list --json`), then route to `happyskills-publish` for the conversion: "Say 'convert these external skills' and the publish skill will run convert + post-convert enrichment for each." Don't run convert yourself — it's owned by publish. |

For tone guidelines and exact response phrasing, read [references/happy-skills.md](references/happy-skills.md).

---

## Section 6 — Present Results

Parse the JSON output and present human-friendly results. JSON envelope:
- Success: `{ "data": { ... } }`
- Error: `{ "error": { "code": "...", "message": "...", "exit_code": N } }`

**Per-command formatting** (full shapes in [references/cli-reference.md](references/cli-reference.md)):

- **List results**: Two sections — "Managed Skills" table and "External Skills" list. Show counts. `[kit]` badge next to kit entries. Show enabled/disabled status for managed skills.
- **Check results**: Table with Skill | Installed | Latest | Status. Highlight outdated. "N outdated, M up to date".
- **Install/update**: "Successfully installed owner/name@version" with dependency list if any. If `linked_agents` present and non-empty, add "Linked to: Cursor, Windsurf" (display names, not IDs). Multi-install returns array — present each on its own line.
- **Uninstall**: "Removed owner/name" plus pruned orphans list. Multi-uninstall returns array. Show warnings for skills not installed.
- **Whoami**: Username, email, and workspace list.
- **Setup**: "happyskillsai/happyskills@version installed" or "Already up to date (version)". If newly installed: "Restart Claude Code to activate the skill."
- **Self-update**: "happyskills updated from X.Y.Z to A.B.C" or "Already up to date (version)".
- **Config**: Show config key-value pairs. For `config agents --list`, table with ID | Agent | Detected | Default. Show source ("from config" or "auto-detect").
- **Happy status**: "N skills are happy" + if external skills exist, "M are still waiting to join the family" with their names listed. See [references/happy-skills.md § Tone Guidelines](references/happy-skills.md).
- **Enable/Disable**: Per-skill: "Enabled owner/name" or "owner/name is already enabled" (warning). Summary: "N skill(s) enabled". For disable, remind the user files remain in `.agents/skills/` and can be re-enabled anytime.

**Update-check warning:** The CLI may print "Update available: vX → vY" to stderr. Non-blocking. If asked, explain they can upgrade via `happyskills self-update`.

---

## Section 7 — Error Handling

If JSON has an `error` key, handle by code:

| Error Code | Recovery |
|---|---|
| `INTERACTIVE_REQUIRED` | Trigger auth flow (Section 2) |
| `AUTH_REQUIRED` | Trigger auth flow, then retry the original command |
| `USAGE_ERROR` | Show correct command syntax. Common: missing skill name, wrong format (must be `owner/name`). |
| `NETWORK_ERROR` | "Cannot reach the HappySkills API. Check your internet connection." |
| `API_ERROR` | Show the server's error message verbatim. |
| `DIVERGED` (or API error containing "diverged") | Route to `happyskills-sync` ("say 'why can't I publish' and sync will diagnose"). |
| `ERROR` | Show the error message. Suggest possible fixes based on context. |

Common error patterns and fixes:
- `"Skill must be in owner/name format"` → remind user to use `owner/name` format
- `"not found in .claude/skills/"` → check spelling, or try with `-g` for global skills
- `"Dependency conflicts detected"` → suggest `--force` to override, explain the conflict
- `"No matching version"` → the requested version doesn't exist; suggest checking available versions

---

## Section 8 — Parameter Extraction

Extract from natural language:

- **Skill names**: Must be fully qualified `owner/name` (e.g., `acme/deploy-aws`). If just a name given, ask for clarification.
- **Version pins**: "version 1.2.0", "@1.2.0", "pin to 1.2.0" → `--version 1.2.0` or inline `skill@1.2.0`.
- **Global scope**: "globally", "global", "system-wide", "for all projects" → `-g` flag.
- **Force / fresh resolve**: "force" or "ignore conflicts" → `--force`. "from scratch", "fresh", "re-resolve" → `--fresh`.
- **Agent targeting**: "for Cursor" → `--agents claude,cursor`. "only Claude" or "just Claude" → `--agents claude`. "all agents" → omit the flag (auto-detect default).

**Disambiguation:**
- "add" alone (with skill name) → `install`. "add person/member to workspace" → route to `happyskills-collab` (or concierge if collab not installed).
- "remove" alone (with skill name) → `uninstall`. "remove from workspace" → route to collab. "remove from registry" → route to publish.
- "search" → route to `happyskills-help` (concierge).
- "audit" + skill name → route to `happyskills-design`. "audit skills" (plural, no name) → `list` (it's an inventory request).

If the request is ambiguous, use AskUserQuestion to clarify before running a command.

---

## Section 9 — Constraints

- **ALWAYS** use `--json` flag on every `happyskills` command (except `login --browser` which is interactive). Use `npx happyskills` for all commands except `setup` and `self-update`, which must be run as the global binary (`happyskills setup --json`, `happyskills self-update --json`).
- **ALWAYS** add `-y` flag to commands that support it (`install`, `uninstall`, `update`) since you handle confirmations via AskUserQuestion.
- **NEVER** add `-y` to `setup` or `self-update` — these commands do not accept it.
- **ALWAYS** confirm with AskUserQuestion before destructive operations: `uninstall`.
- **NEVER** run `npx happyskills login --password` — exposes credentials in the LLM context.
- **NEVER** fabricate CLI flags or subcommands not documented in this skill or [references/cli-reference.md](references/cli-reference.md).
- **NEVER** modify files directly for CLI package management — all install, uninstall, update operations go through `npx happyskills`.
- **NEVER** run commands without parsing and presenting the JSON output.
- **ALWAYS** run `npx happyskills` from the **project root** (the directory containing `.claude/`). Exceptions: `setup` and `self-update` are location-independent.
- **ALWAYS** use fully qualified `owner/name` in install/uninstall. When operating on 2+ skills, batch into one command (e.g., `install owner/a owner/b -y --json`). Never run separate sequential commands.
- **NEVER** invoke search/find/recommend — route to `happyskills-help` (concierge).
- **NEVER** invoke publish/release/bump/validate/convert/fork/delete/visibility — route to `happyskills-publish`.
- **NEVER** invoke design/audit/scaffold/review/improve — route to `happyskills-design`.
- **NEVER** invoke status/pull/diff — route to `happyskills-sync`.
- **NEVER** invoke people/groups/access — route to `happyskills-collab` (or to concierge to install it if not present).
