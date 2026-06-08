# happyskills (core) — CLI Reference

Detailed CLI syntax and JSON response shapes for the lifecycle, auth, setup, and config commands owned by core. SKILL.md has the routing table — this file has exact flag semantics and response shapes per command.

## Envelopes

- Success: `{ "data": { ... } }`
- Error: `{ "error": { "code": "...", "message": "...", "exit_code": N } }`

Error codes: `ERROR` (1), `USAGE_ERROR` (2), `AUTH_REQUIRED` (3), `NETWORK_ERROR` (4), `INTERACTIVE_REQUIRED` (1), `API_ERROR` (1).

---

## install

```bash
npx happyskills install owner/name -y --json
npx happyskills install owner/name@1.2.0 -y --json            # specific version
npx happyskills install owner/name@latest -y --json            # absolute latest
npx happyskills install owner/name -g -y --json                # globally
npx happyskills install owner/name --force -y --json           # ignore conflicts
npx happyskills install owner/name --fresh -y --json           # ignore lock file
npx happyskills install owner/name --agents claude,cursor -y --json  # target specific agents
npx happyskills install owner/a owner/b owner/c -y --json      # batch — one call
npx happyskills install -y --json                              # from manifest/lock
```

**JSON shape — single skill:**

```json
{ "data": { "skill": "owner/name", "version": "1.0.0", "installed": [...], "skipped": [...], "warnings": [...], "forced": [...], "linked_agents": ["cursor", "windsurf"] } }
```

**JSON shape — multiple skills:**

```json
{ "data": [{ "skill": "owner/a", "version": "1.0.0", "installed": [...], ... }, ...] }
```

**Partial failures:** `{ "data": [...], "errors": [{ "skill": "owner/x", "error": "..." }] }`

**JSON shape — no argument (from manifest):**

```json
{ "data": { "installed": [...], "skipped": [...] } }
```

`linked_agents`: array of agent IDs receiving symlinks. Agent IDs: `claude`, `cursor`, `windsurf`, `codex`, `copilot`, `aider`, `cline`, `roo`. Empty/absent if no secondary agents detected.

---

## uninstall

```bash
npx happyskills uninstall owner/name -y --json
npx happyskills uninstall owner/a owner/b owner/c -y --json    # multiple
npx happyskills uninstall owner/name -g -y --json               # global
```

Accepts one or more skills. If a skill is not installed, a warning is printed and the remaining skills continue. JSON output: single object for one skill, array for multiple. Partial failures include an `errors` array alongside `data`.

**JSON shape — single:**

```json
{ "data": { "skill": "owner/name", "removed": [...], "orphans_pruned": [...] } }
```

**JSON shape — multiple:**

```json
{ "data": [{ "skill": "owner/a", "removed": [...], "orphans_pruned": [...] }, ...] }
```

---

## list

```bash
npx happyskills list --json
npx happyskills list -g --json    # global
```

**JSON shape:**

```json
{
  "data": {
    "skills": {
      "owner/name": { "version": "1.0.0", "source": "direct|dep", "status": "installed|missing", "type": "skill|kit", "enabled": true }
    },
    "external": [{ "name": "skill-name", "description": "..." }]
  }
}
```

- `source`: `direct` = explicitly installed, `dep` = transitive dependency.
- `type`: `"skill"` or `"kit"`. Kits shown with `[kit]` badge.
- `enabled`: `true` if the skill has symlinks in agent folders, `false` if disabled. Only applies to managed skills.
- `external`: skills found on disk but not in lock file.

---

## check

```bash
npx happyskills check --json                         # all
npx happyskills check owner/name --json              # specific skill
```

**JSON shape:**

```json
{
  "data": {
    "results": [{ "skill": "owner/name", "installed": "1.0.0", "latest": "1.1.0", "status": "up-to-date|outdated|conflicts|no-access|unknown|error", "via": "parent/skill-or-kit"|null }],
    "outdated_count": 2,
    "up_to_date_count": 3,
    "conflicts_count": 0
  }
}
```

`via`: `null` for directly installed skills, or the name of the parent skill/kit that pulled this in as a dependency.

---

## update

```bash
# Update a specific skill (no-op if already at latest)
npx happyskills update owner/name -y --json

# Smart batch — checks all root-level skills, only re-installs outdated
npx happyskills update --all -y --json

# Force re-install regardless of version (also overwrites local modifications).
# Use ONLY when corruption is suspected — much slower.
npx happyskills update --all --force -y --json

# Globally
npx happyskills update --all -g -y --json
```

`update` runs one batch `POST /repos:check-updates` call up front, classifies each candidate as `outdated`/`up-to-date`/etc., and only re-installs the outdated ones. Skills already at the latest produce no download. Skills with local modifications are skipped with a warning suggesting `happyskills pull` (route the user to `happyskills-sync`). Use `--force` to overwrite.

`--all` only checks root-level skills; transitive dependencies follow their parents through the install pipeline. For a specific target, any locked skill is allowed.

**JSON shape — smart path:**

```json
{
  "data": {
    "results": [{ "skill": "owner/name", "installed": "1.0.0", "latest": "1.1.0", "status": "outdated" }],
    "outdated_count": 1,
    "up_to_date_count": 2,
    "updated": [{ "skill": "owner/name", "from": "1.0.0", "to": "1.1.0" }],
    "skipped": [{ "skill": "owner/other", "reason": "local_modifications", "suggestion": "happyskills pull owner/other" }],
    "already_up_to_date": [{ "skill": "owner/name2", "version": "2.0.0" }],
    "errors": []
  }
}
```

**JSON shape — `--force`:**

```json
{
  "data": {
    "updated": [{ "skill": "owner/name", "from": "1.0.0", "to": "1.0.0", "via": "parent/skill-or-kit"|null }],
    "count": 1,
    "forced": true
  }
}
```

---

## enable / disable

```bash
npx happyskills enable owner/name --json
npx happyskills enable deploy-aws --json                          # short name
npx happyskills enable owner/skill-a owner/skill-b --json         # multiple
npx happyskills enable -g owner/name --json                       # global
npx happyskills enable owner/name --agents claude,cursor --json   # target agents

npx happyskills disable owner/name --json
npx happyskills disable deploy-aws monitoring --json
```

Disable removes symlinks from agent folders but keeps physical files in `.agents/skills/` and the lock entry intact. Enable re-creates symlinks. Aliases: `on` (enable), `off` (disable).

**JSON shape — enable:**

```json
{ "data": { "results": [{ "skill": "owner/name", "status": "enabled|already_enabled|not_found|missing|error" }] } }
```

**JSON shape — disable:**

```json
{ "data": { "results": [{ "skill": "owner/name", "status": "disabled|already_disabled|not_found|error" }] } }
```

---

## login / logout / whoami

**Login** — see Section 2 of SKILL.md for the full flow. Do NOT run `npx happyskills login --password`.

```bash
npx happyskills login --json --browser    # 6-minute timeout
```

**JSON shape — already logged in:**

```json
{ "data": { "status": "already_logged_in", "username": "...", "email": "..." } }
```

**Logout:**

```bash
npx happyskills logout --json
```

**JSON shape:**

```json
{ "data": { "status": "logged_out" } }
```

**Whoami (requires auth):**

```bash
npx happyskills whoami --json
```

**JSON shape:**

```json
{ "data": { "username": "...", "email": "...", "workspaces": [{ "slug": "...", "type": "personal|org" }] } }
```

---

## setup / self-update

**Setup — install the `happyskills` skill (no auth required):**

```bash
happyskills setup --json           # project-level (default)
happyskills setup -g --json        # global
```

Idempotent — reports `already_up_to_date` if current. If newly installed, tell user: "Restart Claude Code to activate the skill."

**JSON shape:**

```json
{ "data": { "skill": "happyskillsai/happyskills", "version": "2.0.0", "status": "installed|already_up_to_date" } }
```

**Self-update — upgrade the `happyskills` CLI npm package itself (no auth):**

```bash
happyskills self-update --json
```

**JSON shape:**

```json
{ "data": { "status": "already_up_to_date|updated", "from": "0.39.0", "to": "0.40.0", "version": "0.40.0" } }
```

`from`/`to` only present when status is `updated`. `version` always present.

---

## config

**View all config:**

```bash
npx happyskills config --json
```

```json
{ "data": { "config": { "agents": "claude,cursor" }, "path": "~/.config/happyskills/config.json" } }
```

**View / set / reset / list agents:**

```bash
npx happyskills config agents --json                  # get
npx happyskills config agents claude,cursor --json     # set
npx happyskills config agents --reset --json          # reset to auto-detect
npx happyskills config agents --list --json           # full agent table
```

**JSON shapes:**

```json
// get
{ "data": { "key": "agents", "value": "claude,cursor", "source": "config|auto-detect" } }

// set
{ "data": { "key": "agents", "value": "claude,cursor", "agents": ["claude", "cursor"] } }

// reset
{ "data": { "key": "agents", "status": "reset", "source": "auto-detect" } }

// --list
{ "data": { "agents": [{ "id": "claude", "display_name": "Claude Code", "skills_dir": ".claude/skills", "detected": true, "default": true }], "source": "config|auto-detect" } }
```

---

## Error Recovery

| Error Code | Recovery |
|---|---|
| `INTERACTIVE_REQUIRED` | Trigger auth flow (Section 2 of SKILL.md) |
| `AUTH_REQUIRED` | Trigger auth flow, then retry the original command |
| `USAGE_ERROR` | Show correct command syntax. Common: missing skill name, wrong format (must be `owner/name`). |
| `NETWORK_ERROR` | "Cannot reach the HappySkills API. Check your internet connection." |
| `API_ERROR` | Show the server's error message verbatim. |
| `DIVERGED` (or API error containing "diverged") | Route to `happyskills-sync` ("say 'why can't I publish' and sync will diagnose"). |
| `ERROR` | Show the error message. Suggest possible fixes based on context. |

If a command fails with `AUTH_REQUIRED` (exit code 3), automatically trigger the auth flow from Section 2 of SKILL.md and retry once.
