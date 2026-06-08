# happyskills-sync — CLI Reference

Detailed CLI syntax and JSON response shapes for `status`, `pull`, and `diff`. SKILL.md has the routing decision tree — this file has exact flag semantics and response shape per command.

## Envelopes

- Success: `{ "data": { ... } }`
- Error: `{ "error": { "code": "...", "message": "...", "exit_code": N } }`

Error codes: `ERROR` (1), `USAGE_ERROR` (2), `AUTH_REQUIRED` (3), `NETWORK_ERROR` (4), `INTERACTIVE_REQUIRED` (1), `API_ERROR` (1), `DIVERGED` (handled per Section 5 of SKILL.md).

---

## status

**Usage:**

```bash
npx happyskills status --json
npx happyskills status owner/name --json
npx happyskills status -g --json
```

**Flags:**

| Flag | Description |
|---|---|
| (positional) | Optional: limit to a single skill (`owner/name`). Without it, all installed skills are checked. |
| `-g`, `--global` | Check globally installed skills |

**Status values:** `clean`, `modified`, `outdated`, `diverged`, `conflicts`, `not_found`.

**JSON shape:**

```json
{
  "data": {
    "results": [
      {
        "skill": "owner/name",
        "base_version": "1.0.0",
        "base_commit": "abc123",
        "local_modified": true,
        "remote_updated": true,
        "remote_version": "1.1.0",
        "remote_commit": "def456",
        "conflict_files": [],
        "status": "clean|modified|outdated|diverged|conflicts|not_found"
      }
    ]
  }
}
```

- `local_modified`: `true` if local files differ from base integrity hash
- `remote_updated`: `true` if remote head commit differs from `base_commit`
- `conflict_files`: array of file paths with unresolved conflict markers (from a prior pull)
- `status`: derived from `local_modified` + `remote_updated` + `conflict_files`

---

## pull

**Usage:**

```bash
npx happyskills pull owner/name --json
npx happyskills pull owner/name --theirs --json
npx happyskills pull owner/name --ours --json
npx happyskills pull owner/name --theirs SKILL.md,skill.json --ours references/foo.md --json
npx happyskills pull owner/name --force --json
npx happyskills pull owner/name -g --json
npx happyskills pull owner/name --json --full-report
npx happyskills pull owner/name --strict --json
```

**Flags:**

| Flag | Description |
|---|---|
| `--theirs [files]` | Take remote version on conflicts. No value = all files. Comma-separated list = only those files. |
| `--ours [files]` | Keep local version on conflicts. Same syntax as `--theirs`. |
| `--force` | Discard ALL local changes, fast-forward to remote (DESTRUCTIVE — confirm via AskUserQuestion first) |
| `-g`, `--global` | Pull globally installed skill |
| `--strict` | Fail on incompatible dependency ranges instead of warning |
| `--full-report` | Include inline file content and resolution steps in JSON output (requires `--json`). Designed for AI agent semantic review. |

**Pull outcomes:** `up_to_date`, `fast_forward`, `merged`, `conflicts`.

**JSON shape — up to date:**

```json
{ "data": { "status": "up_to_date", "skill": "owner/name" } }
```

**JSON shape — fast forward:**

```json
{ "data": { "status": "fast_forward", "skill": "owner/name", "version": "1.1.0" } }
```

**JSON shape — merged or conflicts:**

```json
{
  "data": {
    "status": "merged|conflicts",
    "report": {
      "files": [{ "path": "SKILL.md", "classification": "both_modified", "conflict_written": false, "merge_result": {} }],
      "summary": { "auto_merged": 2, "conflicts": 0 }
    },
    "conflict_files": ["SKILL.md"],
    "json_conflicts": [{ "field": "description", "suggestion": "..." }],
    "resolution_steps": []
  }
}
```

- `status`: `merged` = all files auto-merged cleanly, `conflicts` = some files have conflict markers
- `report.files[].classification`: file change type (e.g., `both_modified`, `remote_only_modified`, `local_only_added`)
- `report.files[].conflict_written`: boolean — `true` if conflict markers were written to this file
- `report.files[].merge_result`: object with merge details. Shape depends on file type:
  - Text files: `{ type: "text", conflict_count: N, conflict_regions: [...] }`
  - skill.json: `{ type: "json", conflicts: [...] }` (field-level suggestions)
  - CHANGELOG.md: `{ type: "changelog", has_conflicts: bool, used_fallback: bool }`
- `conflict_files`: array of file paths that have unresolved conflict markers (empty if status is `merged`)
- `json_conflicts`: array of skill.json field-level merge suggestions (review, not errors)
- `resolution_steps`: only present with `--full-report`. Array of action-typed steps: `resolve_conflict_markers`, `review_json_suggestions`, `semantic_review`, `verify`

**Full report mode** (`--json --full-report`): each file entry in `report.files` is enriched with `base_content`, `local_content`, `remote_content`, `merged_content` (inline text) so the LLM can reason about the merge without extra file reads.

---

## diff

**Usage:**

```bash
npx happyskills diff owner/name --json                  # local vs base (default)
npx happyskills diff owner/name --remote --json          # base vs remote
npx happyskills diff owner/name --full --json            # three-way comparison
npx happyskills diff owner/name --no-content --json      # file list only
npx happyskills diff owner/name -g --json                # global skill
```

**Flags:**

| Flag | Mode | Shows |
|---|---|---|
| (default) | local | What you changed since install (local vs base) |
| `--remote` | remote | What changed on the registry (base vs remote) |
| `--full` | full | Three-way comparison (local + remote vs base) |
| `--no-content` | (any) | Show only the file list without unified content diffs |
| `-g`, `--global` | (any) | Diff a globally installed skill |

**File classifications:** `M (local)` modified locally, `M (remote)` modified on remote, `M (both)` modified on both sides, `A (local/remote)` added, `D (local/remote)` deleted.

**JSON shape:**

```json
{
  "data": {
    "mode": "local|remote|full",
    "report": {
      "files": [{ "path": "SKILL.md", "classification": "local_only_modified", "base_sha": "...", "local_sha": "...", "remote_sha": null, "diff": "--- base/SKILL.md\n+++ local/SKILL.md\n@@ -10,3 +10,3 @@..." }],
      "summary": { "total": 12, "clean": 11, "auto_merged": 1, "conflicted": 0 }
    }
  }
}
```

- `mode`: `local` (default, local vs base), `remote` (base vs remote), `full` (three-way)
- `report.files`: array of file entries with path, classification, SHAs, and unified diff
- `diff`: unified diff text for the changed file (present on all changed files except `both_modified`)
- `local_diff` + `remote_diff`: for `both_modified` files, separate diffs showing base→local and base→remote changes
- Use `--no-content` to omit the `diff`/`local_diff`/`remote_diff` fields (file list only)

---

## Error Recovery

| Error Code | Recovery |
|---|---|
| `INTERACTIVE_REQUIRED` | Trigger auth flow (Section 9 of SKILL.md) |
| `AUTH_REQUIRED` | Trigger auth flow, then retry the original command |
| `USAGE_ERROR` | Show correct command syntax. Common: missing `owner/name` format. |
| `NETWORK_ERROR` | Tell user: "Cannot reach the HappySkills API. Check your internet connection." |
| `API_ERROR` | Show the server's error message verbatim. |
| `DIVERGED` (or API error containing "diverged") | Remote has advanced. Run `pull` to merge, resolve any conflicts, then retry. See Section 5 of SKILL.md. |
| `ERROR` | Show the error message. Suggest possible fixes based on context. |

If a sync command fails with `AUTH_REQUIRED` (exit code 3), automatically trigger the auth flow from Section 9 of SKILL.md and retry once.
