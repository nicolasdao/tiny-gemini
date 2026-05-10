---
name: release-tiny-gemini
description: tiny-gemini — Release the tiny-gemini Node.js CLI. Bumps package.json, syncs cli.js, updates CHANGELOG.md, commits, and tags. Use when releasing tiny-gemini, cutting a release, or drafting unreleased changelog notes. Not for npm publish.
arguments: [action, note]
argument-hint: "[patch|minor|major|draft|auto] [\"description\"]"
allowed-tools: Bash, Read, Edit, Grep, Glob, AskUserQuestion
---

# Release tiny-gemini

Release a new version of the tiny-gemini Node.js CLI following semver, Keep a Changelog, and the project's `package.json` + `cli.js` version-sync convention. Stops after creating a local commit and annotated tag — `git push` and `npm publish` are run by the user.

## Arguments

- **$action** (optional, position 0)
  - `patch`, `minor`, `major` — explicit semver bump, full release
  - `draft` — Mode C, write unreleased notes only, no version bump or tag
  - `auto` or omitted — analyze changes and determine the bump
- **$note** (optional, position 1) — quoted description to include in the release. When provided, MUST be reflected in the changelog entry and factored into the bump decision (a note describing a breaking change forces major). Additive to git analysis, not a replacement.

## Release Modes

### Mode A — Hot Release

The current session contains substantial work on tiny-gemini (file edits, bug discussions, feature implementation). Use BOTH session context AND git analysis. Changelog quality is highest because intent and trade-offs are known.

### Mode B — Cold Release

New session with no prior tiny-gemini context. Use git only:
1. Read current version from `package.json`
2. Read CHANGELOG.md for the last release entry
3. Find last tag matching `v<version>` (e.g., `v1.2.0`)
4. `git log <last-tag>..HEAD` to find changes; if no tags, use all commits
5. For unclear commits, examine actual diffs (`git diff <last-tag>..HEAD`)
6. Check CHANGELOG.md for an existing `## [Unreleased]` section (from a prior Mode C draft)
7. Before classifying, pause and ask the user: "I don't have session context for this release. Here's what I found from git. Is there anything the commits don't capture — intent, trade-offs, or context I should know?"

### Mode C — Draft (Context Snapshot)

Triggered when `$action == draft`.

1. Analyze changes using Mode A or B logic (depending on session richness)
2. Write or update the `## [Unreleased]` section in CHANGELOG.md with classified change notes
3. Do NOT bump version, do NOT touch `package.json` or `cli.js`, do NOT tag
4. Stage CHANGELOG.md
5. Commit with: `docs(release): update unreleased changelog notes for tiny-gemini`
6. Show the user what was written

**Pre-flight exception**: Mode C relaxes the clean-directory check (the user is mid-work). Only verify that CHANGELOG.md itself is not in a conflicting state (e.g., unstaged changes to CHANGELOG.md that would be overwritten — if so, abort).

## Pre-flight Checks (Hard Gates)

Run all checks. If any fail, abort with a clear message. **Do NOT offer a "proceed anyway" option.**

### 1. Clean working tree (skipped in Mode C)

```bash
git status --porcelain
```

If non-empty, abort with:

```
Cannot release — uncommitted changes in the repo:

<git status output, verbatim>

The release only commits package.json + cli.js + CHANGELOG.md.
It does NOT commit your feature/fix code, so running it now
would produce a tag that doesn't contain the changes it ships.

Commit your changes first, then re-run /release-tiny-gemini.
```

### 2. On master branch

```bash
git rev-parse --abbrev-ref HEAD
```

If not `master`, abort with:

```
Cannot release — current branch is <branch>, not master.
Releases must be cut from master. Switch with `git checkout master` and re-run.
```

### 3. CHANGELOG.md exists

```bash
test -f CHANGELOG.md
```

If missing, create it with the standard Keep a Changelog header (see [Section 7](#7-changelog-format)) before continuing.

## Change Analysis

### Source of truth priority
1. Session context (Mode A only) — highest quality
2. `$note` argument — explicit user-provided description, always respected
3. Existing `## [Unreleased]` notes in CHANGELOG.md (from a prior Mode C draft)
4. Git log since last `v<version>` tag
5. Git diff when commit messages are unclear

### Finding the last release
1. Read `version` from `package.json`
2. List tags matching `v<version>` (e.g., `git tag --list 'v*'`)
3. If `package.json` version and latest tag disagree, trust `package.json` — tags may be missing or out of sync
4. If no tags exist, diff against the initial commit

### Filtering rules
- Ignore merge commits unless they contain meaningful context
- Squash related commits into single logical changes (one bullet per logical change, not per commit)
- Skip pure CI/dependency/internal-refactor commits when classifying — but still count them as patch-worthy if nothing else qualifies

### Nothing meaningful changed

If analysis determines nothing meaningful changed, ask via AskUserQuestion:

```
There's nothing worth releasing. Changes since the last release are limited to:
<brief description — e.g., "CI tweaks and internal refactors">

Would you like to proceed with a patch anyway, or skip the release?
```

## Change Classification

Use [Keep a Changelog](https://keepachangelog.com) categories:

| Category | Description | Default Bump Signal |
|---|---|---|
| **Added** | New features, commands, options, capabilities | minor |
| **Changed** | Changes to existing behavior or output format | minor or patch |
| **Deprecated** | Features marked for future removal | minor |
| **Removed** | Features, commands, or options removed | major |
| **Fixed** | Bug fixes | patch |
| **Security** | Vulnerability fixes | patch or minor |

## Bump Rules

| Condition | Bump |
|---|---|
| Breaking change (removed commands/flags, changed defaults, incompatible output) | **major** |
| New feature, command, option, or capability | **minor** |
| Bug fixes, performance improvements, internal refactors, dependency updates, docs | **patch** |
| Nothing meaningful changed | **no release** (ask user) |

### Override handling

- If `$action` is LOWER than what changes warrant (e.g., user says `patch` but there are new features), warn and ask for confirmation. Do NOT silently downgrade.
- If `$action` is HIGHER than changes warrant, proceed without warning — the user may have reasons.
- If `$action == auto` or omitted, the AI determines the bump.

## CHANGELOG.md Format

Always `CHANGELOG.md` (uppercase) at the project root. Format follows [Keep a Changelog](https://keepachangelog.com) and the existing CHANGELOG.md conventions of this project.

### Structure

```markdown
# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [2.1.0] - 2026-05-10

### Added

- Add `--prompt-file` flag for injecting file contents into prompts

### Fixed

- Fix streaming output truncation under heavy back-pressure
```

### Writing rules
- One bullet per **logical change** — squash related commits
- Start each bullet with an imperative verb: "Add", "Fix", "Remove", "Change", "Update"
- Mention command names, flag names, and file names where helpful
- Omit categories with no entries (no empty `### Fixed` sections)
- Newest release at the top, just below the header and `[Unreleased]` section
- `## [Unreleased]` section always present, even if empty after stamping
- Date format: ISO 8601 (`YYYY-MM-DD`) — use today's date from the runtime environment
- Version in brackets: `## [2.1.0] - 2026-05-10`
- For breaking changes, follow the existing convention used in earlier 2.0.0 entry: `### Changed (breaking)` heading

### Stamping a release
1. Move all content from `## [Unreleased]` into a new versioned section
2. Leave `## [Unreleased]` empty (but present) at the top
3. Add the new version number and today's date

## Version Bump

Two files MUST stay in sync:

### 1. `package.json`

Update the `version` field. Use Edit (not jq or sed) to preserve formatting:

```
"version": "<old>"  →  "version": "<new>"
```

### 2. `cli.js`

The CLI duplicates the version on **line 14** as a constant:

```js
const VERSION = '<old>';
```

Update it to the new value. Use Edit with the exact `const VERSION = 'X.Y.Z';` pattern to avoid matching other occurrences.

### Verify CLI loads

After the bump, verify the CLI runs and reports the new version:

```bash
node cli.js --version
```

Expected output: `tiny-gemini v<new-version>`

If the output does not match `tiny-gemini v<new-version>`, abort the release and report the mismatch — this means the cli.js sync failed or there is a syntax error.

## Confirmation Before Commit

Before staging or committing, use AskUserQuestion to confirm. Show:

- **Current version → New version** (e.g., `2.0.0 → 2.1.0`)
- **Bump type** and rationale (or "explicit `$action`")
- **Full changelog entry** that will be written
- **Files that will be modified**: `package.json`, `cli.js`, `CHANGELOG.md`
- **Commit message**: `chore(release): tiny-gemini v<new-version>`
- **Tag**: `v<new-version>`

Options:
- **Proceed with the release** (Recommended)
- **Change the bump type**
- **Edit the changelog manually first**
- **Abort**

Only proceed after explicit user confirmation.

## Commit & Tag

### Commit

Stage ONLY these three files — nothing else:

```bash
git add package.json cli.js CHANGELOG.md
```

Then commit with this exact message format:

```bash
git commit -m "chore(release): tiny-gemini v<new-version>"
```

If a pre-commit hook fails, fix the underlying issue and create a NEW commit (do NOT amend, do NOT use `--no-verify`).

### Tag

Create an annotated tag immediately after the commit:

```bash
git tag -a v<new-version> -m "Release v<new-version>"
```

Tag format is `v<version>` (standalone project — the project IS the git root). Confirm the tag was created:

```bash
git tag --list 'v<new-version>'
```

## Final Output

After tagging, show the user a summary:

```
Released tiny-gemini v<new-version>

  Commit: <commit-sha>
  Tag:    v<new-version>

Next steps (run yourself when ready):
  git push origin master
  git push origin v<new-version>
  npm publish
```

Do NOT run `git push` or `npm publish` — these are intentionally manual.

## Constraints

- NEVER push or run `npm publish` — only commit and tag locally
- NEVER stage files other than `package.json`, `cli.js`, and `CHANGELOG.md` in the release commit
- NEVER use `git commit --amend` or `--no-verify`
- NEVER offer a "proceed anyway" option when the working tree is dirty (Mode A/B) or when the branch is not master
- NEVER edit `package.json` without also updating the `const VERSION = '...'` line in `cli.js` — they must stay in sync
- NEVER create the tag before the release commit succeeds
- NEVER silently downgrade an explicit `$action` bump that is too low for the actual changes — warn the user
- NEVER skip the `node cli.js --version` verification step
- NEVER fabricate changelog entries — every bullet must trace to a real change in the session, the `$note`, an `[Unreleased]` draft, or git history
- ALWAYS use today's date (ISO 8601) when stamping a release
- ALWAYS use AskUserQuestion to confirm before the release commit
- ALWAYS preserve existing CHANGELOG.md formatting conventions (e.g., `### Changed (breaking)` headings, blank lines between sections)
- ALWAYS run all pre-flight checks before any file modification
