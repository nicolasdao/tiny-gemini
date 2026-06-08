# happyskills-design — CLI Reference

Detailed CLI syntax and JSON response shapes for the commands design runs internally. SKILL.md has the workflows; this file has the exact flag semantics and response shapes.

Most of design's work is file editing (Write, Edit). The one CLI command design owns is `init`. Design also runs `validate` from within its workflows — `validate`'s flags and shape are documented in `happyskills-publish/references/cli-reference.md` (publish owns the `validate` verb).

## Envelopes

- Success: `{ "data": { ... } }`
- Error: `{ "error": { "code": "...", "message": "...", "exit_code": N } }`

---

## init

Scaffold a new skill or kit directory. Used by the Authoring Workflow (SKILL.md Section 2 step 3) and the Kit Creation Workflow (SKILL.md Section 5).

```bash
npx happyskills init my-skill --json              # named skill
npx happyskills init --json                        # use current directory name
npx happyskills init my-skill -g --json            # global
npx happyskills init my-kit --kit --json           # scaffold a kit
```

For kits, `--kit` flips the scaffolded `skill.json` to `"type": "kit"` and produces a plain SKILL.md without YAML frontmatter (kits are invisible to Claude auto-invocation by design — the user invokes them by name via `install`).

### JSON shape

```json
{
  "data": {
    "name": "skill-name",
    "type": "skill",
    "files_created": ["skill.json", "SKILL.md"],
    "directory": "/absolute/path"
  }
}
```

- `name`: the skill or kit name (lowercase-with-hyphens)
- `type`: `"skill"` (default) or `"kit"` (when `--kit` flag is used)
- `files_created`: list of files written by init
- `directory`: absolute path to the new skill/kit directory

### Result formatting

- For a skill: `"Created new skill '<name>' at <directory>"` with the file list (`files_created`).
- For a kit: `"Created new kit '<name>' at <directory>"`. Remind the user that the next step is to populate `dependencies` in `skill.json` (or run the Kit Creation Workflow which does this for them).

### Common errors

- `"skill.json already exists"` — the directory already has a skill. Suggest a different name or directory.
- `USAGE_ERROR` (exit code 2) — the name is invalid (must be lowercase-with-hyphens) or the target path is not writable. Reformat and retry.
