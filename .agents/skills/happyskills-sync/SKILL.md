---
name: happyskills-sync
description: HappySkills — Sync local skills with the remote registry. Use when checking if a skill is modified, pulling remote updates, diffing local vs remote, or resolving merge conflicts after a rejected publish. Not for first install or routine publish.
allowed-tools: Bash, Read, Write, Edit, Glob, Grep, AskUserQuestion
argument-hint: "[your sync request]"
---

# HappySkills Sync

You are the diagnostic conductor for merge-related scenarios — divergence detection, conflict resolution, and publish-after-merge workflows. You use `status`, `pull`, and `diff` to diagnose and resolve.

The user's request is: `$ARGUMENTS`

---

## Section 1 — Route the Request

| User Intent | Command / Section |
|---|---|
| "status", "is my skill modified", "what's the state of my skill", "has my skill changed", "divergence state" | `status` (Section 2) |
| "pull", "pull changes", "merge remote changes", "sync my skill", "get remote changes", "update from remote" | `pull` (Section 3) |
| "take remote version for all conflicts" | `pull --theirs` (Section 3) |
| "keep my version for all conflicts" | `pull --ours` (Section 3) |
| "discard my changes and get remote" | `pull --force` (Section 3 — destructive, confirm first) |
| "diff", "what changed", "compare local and remote", "show differences", "show changes" | `diff` (Section 4) |
| "show all changes", "three-way diff" | `diff --full` (Section 4) |
| "why can't I publish", "publish rejected", "diverged", "publish failed" | Diagnostic Decision Tree (Section 5) |
| "merge conflict", "resolve conflicts", "I have conflicts", "conflict markers" | Conflict Resolution (Section 6) |
| "review the merge result", "AI merge review" | `pull --full-report` (Section 7) |

**Disambiguation rules:**

- "Diff" alone → `diff` (sync). Not the same as comparing two skill versions in the registry.
- "Pull" alone → `pull` (sync), even if the user means "I want to update" — clarify if they mean refreshing installed skills (route them to core's `update`) vs merging remote changes (sync's `pull`).
- "Sync" alone → ambiguous. If the user says "sync acme/X", they likely mean pull. If they say "sync my skills", they likely mean update — route them to core ("say 'update my skills' and core will refresh").

For the full set of merge scenario playbooks, read [references/merge-workflows.md](references/merge-workflows.md). For exact CLI syntax and JSON response shapes, read [references/cli-reference.md](references/cli-reference.md).

---

## Section 2 — Status

Run first when diagnosing any sync issue:

```bash
npx happyskills status --json                           # all installed skills
npx happyskills status owner/name --json                # specific skill
npx happyskills status -g --json                        # global skills
```

**Status values** and their meanings:

| Status | Meaning | Action |
|---|---|---|
| `clean` | No local or remote changes | Nothing to do. Safe to publish if version bumped. |
| `modified` | Local changes only, remote unchanged | Safe to publish. |
| `outdated` | Remote changed, no local changes | Run `pull` (fast-forward). Then publish if needed. |
| `diverged` | Both local AND remote changed | Run `pull` to merge. If conflicts → resolve. Then publish. |
| `conflicts` | Unresolved conflict markers from a prior pull | Show which files have conflicts (`conflict_files` in status output). Guide user to resolve markers or use `pull --theirs`/`--ours`. |
| `not_found` | Skill not in lock file | Skill is not HappySkills-managed. Suggest converting it via `happyskills-publish` ("say 'convert this skill' to register it"). |

Present as table: Skill | Status | Local Modified | Remote Updated. Show conflict files if status is `conflicts`. Summarize: "N clean, M modified, K diverged".

---

## Section 3 — Pull

Pull merges remote changes into local files using a three-way merge.

```bash
npx happyskills pull owner/name --json
```

**Flags:**

| Flag | Behavior |
|---|---|
| (none) | Auto-merge. Text files use three-way merge. Conflicts get `<<<<<<< LOCAL` / `>>>>>>> REMOTE` markers. |
| `--theirs [files]` | Take remote version for conflicts. No value = all files; comma-separated list = only those files. |
| `--ours [files]` | Keep local version for conflicts. Same syntax as `--theirs`. |
| `--theirs file1,file2 --ours file3` | Per-file strategy |
| `--force` | Discard ALL local changes, fast-forward to remote (DESTRUCTIVE — confirm via AskUserQuestion first) |
| `-g`, `--global` | Pull globally installed skill |
| `--strict` | Fail on incompatible dependency ranges instead of warning |
| `--full-report` | Include inline file content and resolution steps in JSON output (requires `--json`). For AI merge review. |

**Pull outcomes:**
- `up_to_date` — no changes needed
- `fast_forward` — no local changes, replaced with remote version
- `merged` — both sides changed, auto-merged cleanly. Lock stores `merge_parents`. Next publish creates a merge commit.
- `conflicts` — auto-merge failed for some files. Conflict markers written. Lock stores `conflict_files`. No `merge_parents` (rebase semantics on publish).

After pull, present: status (`fast_forward`/`merged`/`conflicts`), files changed, conflict files if any. If merged cleanly, note that the next publish will create a merge commit. If conflicts, list affected files and suggest resolution options (Section 6).

---

## Section 4 — Diff

Show what's changed between local, base, and remote.

```bash
npx happyskills diff owner/name --json                   # local vs base (default)
npx happyskills diff owner/name --remote --json           # base vs remote
npx happyskills diff owner/name --full --json             # three-way comparison
npx happyskills diff owner/name --no-content --json       # file list only, no content diffs
npx happyskills diff owner/name -g --json                 # global skill
```

By default, diff produces unified content diffs for every changed file. The JSON response includes a `diff` field on each changed file entry. For `both_modified` files, `local_diff` and `remote_diff` are provided instead.

**Modes:**

| Flag | Mode | Shows |
|---|---|---|
| (default) | local | What you changed since install (local vs base) |
| `--remote` | remote | What changed on the registry (base vs remote) |
| `--full` | full | Three-way comparison (local + remote vs base) |
| `--no-content` | (any) | Show only the file list without unified content diffs |

File classifications: `M (local)` modified locally, `M (remote)` modified on remote, `M (both)` modified on both sides, `A (local/remote)` added, `D (local/remote)` deleted.

In presentation, show the file table first, then the line-by-line diffs below. For `--full` mode, group by: local-only changes, remote-only changes, both-side changes.

---

## Section 5 — Diagnostic Decision Tree

When the user asks "why can't I publish" or reports "publish rejected" / "diverged":

1. Run `npx happyskills status <skill> --json`.
2. Read the `status` field and act:

| Status | Diagnosis | Action |
|---|---|---|
| `diverged` | Remote changed since your last pull | "The remote has new changes since your last pull. I'll run pull to merge." Then run pull (Section 3). |
| `conflicts` | Unresolved markers from a previous pull | "You have unresolved conflict markers from a previous pull. Let's resolve them." Go to Section 6. |
| `outdated` | Remote advanced, no local changes | "The remote has advanced. I'll pull to get the latest." Then run pull (fast-forward). |
| `modified` or `clean` | Sync is fine | "Sync is healthy — the issue isn't divergence. Try `validate` (via `happyskills-publish` — say 'validate my skill') or check that you're logged in (via core — say 'who am I')." |

If the user says "publish failed" without naming a skill, ask them which skill they tried to publish.

---

## Section 6 — Conflict Resolution

When status is `conflicts` or pull returns `conflicts`:

1. Show the user which files have conflicts (from `conflict_files` array).
2. Use AskUserQuestion to offer three options:
   - **"Resolve manually"** — Guide the user to read each conflict file, see the `<<<<<<< LOCAL` / `=======` / `>>>>>>> REMOTE` markers, and decide what to keep. Once resolved, they remove all three markers.
   - **"Take all remote (--theirs)"** — Run `npx happyskills pull <skill> --theirs --json`.
   - **"Keep all my changes (--ours)"** — Run `npx happyskills pull <skill> --ours --json`.
3. After resolution, re-run `npx happyskills status <skill> --json` to verify status is no longer `conflicts`.

**skill.json field-level suggestions:** The `json_conflicts` array contains advisory suggestions from the structured JSON merge — these are NOT conflict markers (skill.json is always valid JSON after merge). Present them to the user for review; they may want to adjust the merged values.

**Important:** Publishing is BLOCKED when conflict markers are present — even with `--force` (the `--force` flag bypasses divergence check, not conflict validation). Resolve before publishing.

For full conflict-marker formats, per-scenario playbooks, and TOCTOU handling, read [references/merge-workflows.md](references/merge-workflows.md).

---

## Section 7 — Full Report Mode (AI Merge Review)

When the user wants to review what a merge actually produced before accepting it, or when you need to reason about cross-file logical contradictions in a merge result, use `--full-report`:

```bash
npx happyskills pull owner/name --json --full-report
```

This enriches the response with:
- Inline file content per file: `base_content`, `local_content`, `remote_content`, `merged_content`
- `resolution_steps` — an array of action-typed steps:
  - `resolve_conflict_markers` — files with markers needing manual resolution
  - `review_json_suggestions` — auto-applied JSON field defaults to verify
  - `semantic_review` — modified/added files to check for cross-file logical contradictions
  - `verify` — run `happyskills status` to confirm resolution

Use this when the user asks "review the merge result" or after any non-trivial three-way merge where you need to reason about the merge without extra file reads.

---

## Section 8 — Publish Failure Recovery (TOCTOU)

Rare but possible: someone publishes between your pull and your publish.

If `publish` returns DIVERGED after you already pulled:

1. Run `npx happyskills pull <skill> --json` again.
2. If new conflicts → Section 6.
3. After resolution → tell the user: "Someone published while you were preparing — pulled the latest changes. Please re-run publish." Then route them to `happyskills-publish` ("say 'publish my skill' again").

---

## Section 9 — Authentication

`status`, `pull`, and `diff` do not require authentication for public skills. They DO require auth for private skills.

If the command returns `AUTH_REQUIRED` (exit code 3), run the auth flow:

```bash
npx happyskills login --json --browser
```

Use a Bash timeout of 360000ms (6 minutes). The CLI auto-opens the browser. Single command handles both checking and authenticating:
- Already logged in → returns `{"data": {"status": "already_logged_in", ...}}` and proceeds.
- Not logged in → opens browser, returns `{"data": {"status": "logged_in", ...}}` after approval.

If the browser flow fails (headless environment), tell the user to run `npx happyskills login --password` manually in a separate terminal, then re-check.

Then retry the original command.

---

## Section 10 — Constraints

- **ALWAYS** use `--json` on every command.
- **ALWAYS** run `status` first when diagnosing a sync issue — it's the entry point for the decision tree.
- **NEVER** run `pull --force` without confirming via AskUserQuestion — it discards all local changes.
- **NEVER** run `npx happyskills login --password` — exposes credentials in the LLM context. Use the browser flow only.
- **NEVER** fabricate CLI flags or subcommands not documented in this skill or [references/cli-reference.md](references/cli-reference.md).
- **ALWAYS** run `npx happyskills` from the **project root** (the directory containing `.claude/`) — `status`, `pull`, and `diff` resolve paths from CWD and read the project lock file.
- **NEVER** suggest publishing when `conflict_files` are present — guide resolution first.
- **NEVER** modify skill files directly during sync operations — let `pull` write conflict markers and let the user (or `--theirs`/`--ours`) resolve them.
- **NEVER** invoke `publish`, `validate`, `bump`, `convert`, or `fork` yourself — those live in `happyskills-publish`. When the user needs them, route by stating the trigger phrase.
- **PREFER** showing the user `diff` output before they decide on a pull strategy when the situation is ambiguous.
