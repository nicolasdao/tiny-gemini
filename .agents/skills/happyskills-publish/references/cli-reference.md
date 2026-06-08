# happyskills-publish — CLI Reference

Detailed CLI syntax and JSON response shapes for `bump`, `validate`, `publish`, `convert`, `fork`, `delete`, and `visibility`. SKILL.md has the routing and pre-flight checks — this file has exact flag semantics and response shapes per command.

## Envelopes

- Success: `{ "data": { ... } }`
- Error: `{ "error": { "code": "...", "message": "...", "exit_code": N } }`

Error codes: `ERROR` (1), `USAGE_ERROR` (2), `AUTH_REQUIRED` (3), `NETWORK_ERROR` (4), `INTERACTIVE_REQUIRED` (1), `API_ERROR` (1), `DIVERGED` (handle per Section 3 of SKILL.md), `NOT_FOUND` (1), `FORBIDDEN` (1), `CONFIRMATION_REQUIRED` (1).

---

## bump

```bash
npx happyskills bump patch my-skill --json                     # patch/minor/major
npx happyskills bump 2.0.0 my-skill --json                     # explicit version
```

**Flags:**

| Flag | Description |
|---|---|
| `<bump-type>` | Positional. `patch`, `minor`, `major`, or an explicit semver string. |
| `<skill-name>` | Positional. The skill to bump. |
| `-g`, `--global` | Bump a globally installed skill |

**JSON shape:**

```json
{ "data": { "skill": "skill-name", "old_version": "1.0.0", "new_version": "1.1.0", "bump_type": "patch|minor|major|explicit" } }
```

---

## validate

```bash
npx happyskills validate my-skill --json
npx happyskills validate my-skill -g --json    # global skill
```

**JSON shape:**

```json
{
  "data": {
    "valid": true,
    "errors": [],
    "warnings": [],
    "checks_passed": 12,
    "checks_failed": 0,
    "checks_warned": 1
  }
}
```

If `data.valid` is `false`, present each error with file/field/message and follow Section 11 of SKILL.md (Validate Error Handling). Warnings are advisory.

Errors may include a `recommendations` array — follow those steps in order and exactly as written.

---

## publish

```bash
# ALWAYS include --workspace
npx happyskills publish my-skill --workspace <slug> --json

# Publish as public on first publish
npx happyskills publish my-skill --workspace <slug> --public --json

# Auto-bump before publishing
npx happyskills publish my-skill --workspace <slug> --bump patch --json
```

**Flags:**

| Flag | Description |
|---|---|
| `<skill-name>` | Positional. The skill to publish. |
| `--workspace <slug>` | **Required**. Workspace to publish into. |
| `--public` | First-publish only. Make the skill public in the catalog. NEVER default. |
| `--bump <patch\|minor\|major>` | Auto-bump version before publishing. (Use Release Workflow instead for full ceremony.) |

**JSON shape:**

```json
{ "data": { "skill": "owner/name", "version": "1.0.0", "ref": "refs/tags/v1.0.0", "bumped_from": "0.9.0" } }
```

`bumped_from`: present if `--bump` was used; otherwise null.

**Pre-flight checks (MANDATORY — see Section 3 of SKILL.md):** managed check, divergence check (route to sync if not clean), validation, workspace resolution.

**NEVER pipe `publish` (or any `--json` command that emits progress lines) through a strict JSON parser** — the CLI prints non-JSON status text to stdout before the JSON envelope. Strict parsers report a parse error, masking whether the underlying operation succeeded.

**If publish returns DIVERGED** (TOCTOU — someone published in your pull-to-publish window): route the user to `happyskills-sync` to pull and re-merge, then re-run publish.

---

## convert

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

**Two modes:**
- **Authenticated:** Resolves workspace automatically from user's workspaces. Checks registry for name conflicts before converting. Recommended before publishing.
- **Not authenticated:** Requires `--workspace <slug>`. Skips registry conflict check. The skill is converted locally — login before publishing.

**JSON shape:**

```json
{ "data": { "skill": "owner/name", "version": "1.0.0", "workspace": "workspace-slug", "description": "..." } }
```

After successful conversion, **always run Post-Convert Enrichment** ([workflows.md § Post-Convert Enrichment](workflows.md)).

---

## fork

```bash
npx happyskills fork owner/name --json

# Fork to a specific workspace
npx happyskills fork owner/name --workspace myorg --json
```

**Flags:**

| Flag | Description |
|---|---|
| `<owner/name>` | Positional. The published skill to fork. |
| `--workspace <slug>` | Optional. Defaults to user's default workspace. |

**JSON shape:**

```json
{ "data": { "skill": "owner/name", "forked_version": "1.2.0", "new_version": "0.1.0", "workspace": "workspace-slug", "directory": "/absolute/path" } }
```

After successful fork, **always run Post-Fork Enrichment** ([workflows.md § Post-Fork Enrichment](workflows.md)).

---

## delete

```bash
npx happyskills delete owner/name --json -y
```

**Flags:**

| Flag | Description |
|---|---|
| `<owner/name>` | Positional. The skill to delete from the registry. |
| `-y` | Skip CLI confirmation prompt (we confirm via AskUserQuestion). |

**JSON shape — success:**

```json
{ "data": { "deleted": true, "skill": "owner/name" } }
```

**JSON shape — errors:**

```json
{ "error": { "code": "NOT_FOUND", "message": "...", "exit_code": 1 } }
{ "error": { "code": "FORBIDDEN", "message": "...", "exit_code": 1 } }
{ "error": { "code": "CONFIRMATION_REQUIRED", "message": "...", "exit_code": 1 } }
```

Confirm via AskUserQuestion before running — this is irreversible.

---

## visibility

**Get current visibility:**

```bash
npx happyskills visibility owner/name --json
```

**Set visibility:**

```bash
npx happyskills visibility owner/name public --json            # public/private/workspace
```

**Flags:**

| Flag | Description |
|---|---|
| `<owner/name>` | Positional. |
| `<visibility>` | Optional positional. `public`, `private`, or `workspace`. Omit to GET. |

**JSON shape — get:**

```json
{ "data": { "skill": "owner/name", "visibility": "public" } }
```

**JSON shape — set:**

```json
{ "data": { "skill": "owner/name", "visibility": "private" } }
```

**JSON shape — errors:**

```json
{ "error": { "code": "NOT_FOUND", "message": "...", "exit_code": 1 } }
{ "error": { "code": "FORBIDDEN", "message": "...", "exit_code": 1 } }
```

Confirm via AskUserQuestion before changing visibility to `public` — it makes the skill visible to all users in the public catalog.

---

## whoami (used internally for workspace resolution)

```bash
npx happyskills whoami --json
```

Used by the Workspace Resolution procedure ([workflows.md § Workspace Resolution](workflows.md)). Returns the user's workspaces.

**JSON shape:**

```json
{ "data": { "username": "...", "email": "...", "workspaces": [{ "slug": "...", "type": "personal|org" }] } }
```

`whoami` is owned by `happyskills` (core) — call it as a one-off for workspace resolution but route the user to core if they ask "who am I" directly.

---

## list (used internally for managed-check)

```bash
npx happyskills list --json
```

Used by the publish pre-flight to check if the skill is managed (`data.skills`) or external (`data.external`). `list` is owned by `happyskills` (core) — call it as a one-off here but route the user to core for general "what's installed" queries.

---

## check (used internally for first-publish detection)

```bash
npx happyskills check <workspace>/<skill-name> --json
```

Used to detect whether a publish is a first publish (returns error → first publish; returns version data → existing skill). `check` is owned by `happyskills` (core) — call it as a one-off here.

---

## status (used internally for divergence pre-flight)

```bash
npx happyskills status <workspace>/<skill-name> --json
```

Used by the publish pre-flight (Section 3 of SKILL.md, step 2) to check divergence. If status is anything other than `clean` or `modified`, route the user to `happyskills-sync` to resolve. `status` is owned by `happyskills-sync` — call it as a one-off here but route the user to sync for general divergence diagnostics.
