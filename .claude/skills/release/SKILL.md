---
name: release
description: Release a new version of tiny-gemini. Bumps version, updates changelog, verifies, commits, tags, and pushes to GitHub. Use when the user says release, publish, deploy, ship, or bump version.
disable-model-invocation: true
allowed-tools: Bash, Read, Edit, Grep, Glob, AskUserQuestion
argument-hint: [patch|minor|major]
---

# Release Workflow

Release a new version of tiny-gemini following semver, Keep a Changelog, and npm best practices.

## Step 1: Determine Bump Type

If `$0` is provided (`patch`, `minor`, or `major`), use it directly.

If no argument is provided:

1. **Reason about the changes made during this session.** You already know what you changed — you are the agent that made the changes. Think through what was added, fixed, removed, or broken.
2. **Read the current CHANGELOG.md** to understand the existing version and prior entries.
3. **Apply semver rules:**
   - `patch` — bug fixes, docs-only changes, minor tweaks, no new features
   - `minor` — new features, new commands, new options, backwards-compatible additions
   - `major` — breaking changes (removed commands, changed defaults, renamed flags, incompatible API changes)
4. **Ask the user to confirm** the bump type using AskUserQuestion before proceeding.

## Step 2: Preflight Checks

Run all three checks. If any fail, stop and tell the user how to fix it.

1. **Clean working tree** — `git status --porcelain`
   - If output is non-empty, tell the user to commit or stash changes first. Do NOT proceed with a dirty tree.
2. **Correct branch** — `git branch --show-current`
   - Must be `master`. If not, warn the user.

## Step 3: Bump Version in package.json

```bash
npm version <bump-type> --no-git-tag-version
```

Then read the new version:

```bash
node -p "require('./package.json').version"
```

Store this value — you will use it in every subsequent step.

## Step 4: Sync VERSION in cli.js

Use the Edit tool to update the hardcoded VERSION constant in `cli.js`:

```javascript
const VERSION = '<new-version>';
```

Search for the existing `const VERSION = ` line and replace the old version string with the new one.

## Step 5: Update CHANGELOG.md

Read the current CHANGELOG.md. Insert a new version section **immediately before** the first existing `## [` version entry.

Follow Keep a Changelog format exactly:

```markdown
## [X.Y.Z] - YYYY-MM-DD

### Added

- Item description

### Changed

- Item description

### Fixed

- Item description
```

**Rules:**
- Only include categories (`Added`, `Changed`, `Deprecated`, `Removed`, `Fixed`, `Security`) that have actual entries
- Write entries from the perspective of a user reading the changelog — describe the impact, not implementation details
- Use today's date in YYYY-MM-DD format

Also add or update the comparison link at the **bottom** of the file:

```markdown
[X.Y.Z]: https://github.com/nicolasdao/tiny-gemini/compare/v<previous>...vX.Y.Z
```

## Step 6: Verify

Run both checks. If either fails, stop and investigate.

```bash
node cli.js --version
```

Confirm the printed version matches the new version exactly.

```bash
npm pack --dry-run 2>&1
```

Show the package contents and total size to the user. Confirm no unexpected files are included and no required files are missing.

## Step 7: Commit and Tag

```bash
git add package.json cli.js CHANGELOG.md
```

If any other files were modified as part of the version sync (unlikely), add those too.

```bash
git commit -m "release: vX.Y.Z"
git tag vX.Y.Z
```

## Step 8: Confirm Before Push

Use AskUserQuestion to get explicit user approval before proceeding:

> Ready to push vX.Y.Z to GitHub. This will make the release public. Proceed?

Do NOT proceed without approval.

## Step 9: Push

```bash
git push && git push --tags
```

## Step 10: Confirm Success and Show Publish Instructions

Show the user:
- New version number
- Git tag
- Confirmation that the release is pushed to GitHub

Then tell the user the package is ready to be published to npm, but this must be done manually. Show the command they need to run:

```
npm publish
```

If this is the **very first publish** (no versions exist on npm yet), show `npm publish --access public` instead.

To check if the package exists on npm: `npm view tiny-gemini version 2>&1`
- If it returns a version, the package exists — show `npm publish`
- If it returns an error (E404), this is the first publish — show `npm publish --access public`

## Constraints

- NEVER skip the verification step (Step 6)
- NEVER push without explicit user confirmation (Step 8)
- NEVER run `npm publish` — publishing to npm must be done manually by the user
- NEVER amend existing commits — always create new commits
- NEVER guess the version — always read it from package.json after npm version runs
- If ANY step fails, STOP immediately and report the error. Do not continue to subsequent steps.
- The release commit should ONLY contain version/changelog files. All other session work must be committed separately before starting this workflow.
