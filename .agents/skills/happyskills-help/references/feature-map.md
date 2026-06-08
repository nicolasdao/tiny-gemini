# HappySkills — Feature Map

Maps user intents to the family-member skill that handles them. Use this as the routing source of truth when a user asks "how do I X" or "which skill handles Y".

**How to use this map:**
1. Find the matching row in the Quick Lookup table below.
2. If the family-member skill is **bundled**, tell the user the trigger phrase — e.g., "Say 'publish my skill' and `happyskills-publish` will handle it." Do NOT run the action yourself; route by stating the phrase.
3. If the family-member skill is **opt-in** (currently only `happyskills-collab`), use Section 5 of SKILL.md (Install-on-Recommendation) to offer install with confirmation.

---

## Quick Lookup — Verb → Skill

| User says | Owned by | Bundled? |
|---|---|---|
| install / add / get / download (a skill) | `happyskills` (core) | yes |
| uninstall / remove / delete (a skill) | `happyskills` (core) | yes |
| list / show what's installed / how many skills | `happyskills` (core) | yes |
| update / upgrade / refresh installed skills | `happyskills` (core) | yes |
| check for outdated / new versions available | `happyskills` (core) | yes |
| enable / disable / turn on / turn off (a skill) | `happyskills` (core) | yes |
| log in / log out / who am I | `happyskills` (core) | yes |
| set up / install happyskills skill | `happyskills` (core) | yes |
| self-update the CLI | `happyskills` (core) | yes |
| configure agents / set defaults | `happyskills` (core) | yes |
| are my skills happy / make my skills happy | `happyskills` (core, with publish for conversion) | yes |
| find / search / recommend skills (registry) | `happyskills-help` (concierge — me) | yes |
| list versions of a skill / how many versions / version history | `happyskills-help` (me) | yes |
| show changelog / release notes / what changed in skill X | `happyskills-help` (me) | yes |
| what is HappySkills / how does it work / explain X | `happyskills-help` (me) | yes |
| design a skill / create / scaffold / init | `happyskills-design` | yes |
| review my skill / SKILL.md best practices | `happyskills-design` | yes |
| audit a skill / quality review / health check | `happyskills-design` | yes |
| update / improve a skill from session learnings | `happyskills-design` | yes |
| create a kit / bundle skills | `happyskills-design` | yes |
| publish a skill / push to registry | `happyskills-publish` | yes |
| release my skill / ship update | `happyskills-publish` | yes |
| bump version | `happyskills-publish` | yes |
| validate / lint / verify a skill | `happyskills-publish` | yes |
| convert external skill to managed | `happyskills-publish` | yes |
| fork a skill | `happyskills-publish` | yes |
| delete from registry | `happyskills-publish` | yes |
| change visibility / make public/private | `happyskills-publish` | yes |
| status / is my skill modified / divergence | `happyskills-sync` | yes |
| pull remote changes / sync my skill | `happyskills-sync` | yes |
| diff / what changed locally vs remote | `happyskills-sync` | yes |
| resolve merge conflicts / conflict markers | `happyskills-sync` | yes |
| why can't I publish / publish rejected / diverged | `happyskills-sync` | yes |
| invite someone to my workspace / add member | `happyskills-collab` | **opt-in** |
| remove member / change role / list workspace members | `happyskills-collab` | **opt-in** |
| create / delete / show groups | `happyskills-collab` | **opt-in** |
| add / remove person to/from a group | `happyskills-collab` | **opt-in** |
| set default group | `happyskills-collab` | **opt-in** |
| grant / revoke / change skill access | `happyskills-collab` | **opt-in** |

---

## 1. Lifecycle (`happyskills` core)

What core owns: install, uninstall, list, check, update (lifecycle), enable/disable, login, logout, whoami, setup, self-update, config, the "happy skills" status check.

**Common triggers and routing:**

| User says | Trigger phrase to use | Underlying command |
|---|---|---|
| "install acme/deploy-aws" | (already there — core fires) | `npx happyskills install acme/deploy-aws -y --json` |
| "remove acme/deploy-aws" | (core fires) | `npx happyskills uninstall acme/deploy-aws -y --json` |
| "list my installed skills" / "how many skills" | (core fires) | `npx happyskills list --json` |
| "are my skills up to date" | (core fires) | `npx happyskills check --json` |
| "update everything" / "refresh skills" | (core fires) | `npx happyskills update --all -y --json` |
| "log in" / "who am I" | (core fires) | `npx happyskills login --json --browser` / `whoami --json` |
| "are my skills happy" | (core fires) | `npx happyskills list --json` (then friendly summary) |
| "make my skills happy" | (core identifies externals, then routes to publish for `convert`) | `npx happyskills convert <name> -y --json` (lives in publish) |

If the user asks "how do I X" for any of these, just answer with the trigger phrase. They don't need to know which skill fires — they just need to say it.

---

## 2. Search & Discovery (`happyskills-help` — me)

What concierge owns: search the registry, version history & changelog lookup, smart project-aware recommendations, ask/explain questions about HappySkills, route to opt-in satellites.

When the user is asking about discovering skills (not specific feature questions), the right answer is to actually run search via [smart-search.md](smart-search.md) — don't just route, *do* the search. Same for `versions` / `changelog` — those are registry lookups owned here, fully documented in [version-history.md](version-history.md).

| User says | Action |
|---|---|
| "find skills for AWS deployment" | Run smart search per [smart-search.md](smart-search.md) |
| "recommend skills for my Node.js project" | Read project context (package.json, README), decompose into domains, search each |
| "find the deploy-aws skill" / "is there a skill called <name>" | `npx happyskills search <slug> --json --limit 5` — the server auto-routes to fuzzy slug search (typo-tolerant) |
| "find <workspace>/<skill>" / "the <skill> skill in <workspace>" / "is there <ws>/<name>" | `npx happyskills search <workspace>/<skill> --json --limit 5` — auto-routes to fuzzy scoped search (typo-tolerant on both halves). If `workspace_match` is `null` in the response, surface the honest failure — don't silently search globally. |
| "what kits exist for React" | `npx happyskills search "react" --type kit --json --limit 10` |
| "search my workspace skills" / "show my published skills" | `npx happyskills search --mine --json --limit 50` (auth required) |
| "skills in <workspace>" | `npx happyskills search --workspace <slug> --json --limit 50` (auth required) |
| "list versions of acme/foo" / "what versions exist" / "version history of X" | `npx happyskills versions <owner/name> --json` — see [version-history.md § Command 1](version-history.md) |
| "show me the last 10 versions of X" / "recent versions" | `npx happyskills versions <owner/name> --json --limit 10` |
| "show changelog for X" / "what changed in X" / "release notes" | `npx happyskills changelog <owner/name> --json` — see [version-history.md § Command 2](version-history.md) |
| "what's in version 1.2.0 of X" / "changelog of X at 1.2.0" | `npx happyskills changelog <owner/name> --version 1.2.0 --json` |
| "help me pick a version of X to install" | Run `versions` first, then `changelog` if useful, then hand off to core with `install <owner/name>@<version>` — see [version-history.md § Combined workflow](version-history.md) |

---

## 3. Skill Authoring & Quality (`happyskills-design`)

What design owns: greenfield design, scaffolding/init, review, audit, update-from-session-learnings, kit creation.

| User says | Trigger phrase to use |
|---|---|
| "design a skill for X" / "help me create a skill" | "Say 'design a skill for X' and `happyskills-design` will run the authoring workflow." |
| "scaffold a new skill" / "init my-skill" | "Say 'create a skill called my-skill' — design will scaffold it." |
| "review my SKILL.md" / "skill best practices" | "Say 'review my skill' and design will load the spec and walk through best practices." |
| "audit this skill" / "is my skill well designed" | "Say 'audit my skill' and design will produce a quality report." |
| "update this skill based on what we did" / "apply session learnings" | "Say 'update this skill from session learnings' and design will run the update workflow." |
| "improve this skill" / "refine this skill" | "Say 'improve my skill' and design will guide the update." |
| "create a kit" / "bundle skills" | "Say 'create a kit' and design will run the kit creation workflow." |

---

## 4. Publishing (`happyskills-publish`)

What publish owns: bump, validate, publish (with pre-flight), the full Skill Release Workflow, convert external skills, fork, delete from registry, change visibility.

| User says | Trigger phrase to use |
|---|---|
| "publish my skill" | "Say 'publish my-skill' — `happyskills-publish` will run pre-flight checks and publish it." |
| "release my skill" / "ship this update" | "Say 'release my skill' and publish will run the full release workflow (analyze changes, bump, changelog, publish)." |
| "bump the version" | "Say 'bump my-skill to a minor version' and publish will run bump." |
| "validate my skill" / "lint" | "Say 'validate my-skill' and publish will run the validator." |
| "convert pulumi-docs" / "make this managed" | "Say 'convert pulumi-docs' and publish will convert it and run post-convert enrichment." |
| "fork acme/deploy-aws" | "Say 'fork acme/deploy-aws' and publish will fork it and run post-fork enrichment." |
| "delete acme/deploy-aws from the registry" | "Say 'delete acme/deploy-aws from the registry' — publish will confirm and delete." |
| "make acme/deploy-aws public" / "change visibility" | "Say 'set visibility of acme/deploy-aws to public' — publish will handle it." |

---

## 5. Sync & Merge (`happyskills-sync`)

What sync owns: status, pull, diff, merge-conflict resolution, publish-failure diagnosis (when divergence is the cause), AI merge review (`--full-report`).

| User says | Trigger phrase to use |
|---|---|
| "what's the status of my skill" | "Say 'check status of my-skill' and `happyskills-sync` will run status." |
| "pull remote changes" / "sync my skill" | "Say 'pull remote changes for X' and sync will pull and auto-merge." |
| "show me what changed" / "diff" | "Say 'diff my-skill' or 'what changed on the remote'." |
| "I have merge conflicts" / "conflict markers" | "Say 'resolve my merge conflicts' and sync will guide resolution." |
| "why can't I publish" / "publish rejected" / "diverged" | "Say 'why can't I publish' — sync will run status and diagnose." |
| "review the merge result" / "did the merge make sense" | "Say 'review the merge for my-skill' and sync will use full-report mode." |

---

## 6. Workspace & Access — Opt-In (`happyskills-collab`)

What collab owns: people (workspace membership), groups (organize members into teams), access (skill permission management).

**This satellite is NOT bundled by default.** When the user asks about any of the features below, run the **install-on-recommendation flow** (Section 6 of SKILL.md):

1. Tell them: "Workspace membership and skill access permissions live in `happyskills-collab` — that's an opt-in skill not installed by default."
2. AskUserQuestion: "Install it" / "Just show the command" / "Not now"
3. If they install: `npx happyskills install happyskillsai/happyskills-collab -y --json`. Then: "Installed. Restart Claude Code, then re-ask your question and `happyskills-collab` will handle it."

Triggers that should fire this flow:

| User says | What collab owns once installed |
|---|---|
| "invite alice to acme workspace" / "add a member" | `people add` |
| "remove someone from workspace" | `people remove` |
| "change alice's role to admin" / "make admin" | `people role` |
| "list workspace members" / "who's in acme" | `people list` |
| "search for users" / "find a user" | `people search` |
| "list groups" / "show groups" | `groups list` |
| "create an engineering group" | `groups create` |
| "delete the engineering group" | `groups delete` |
| "show the engineering group" / "members of engineering" | `groups show` |
| "add alice to engineering group" | `groups add` |
| "remove alice from engineering group" | `groups remove` |
| "make engineering a default group" | `groups default` |
| "grant engineering read access to acme/deploy-aws" | `access grant` |
| "revoke engineering access to acme/deploy-aws" | `access revoke` |
| "change engineering permission to write" | `access set` |
| "list access for engineering" / "what can engineering see" | `access list --group <name>` |
| "who has access to acme/deploy-aws" | `access list --skill <owner/name>` |

---

## 7. Cross-Cutting Topics

These are concepts that span multiple family members. When users ask, you handle them yourself (don't route).

### Authentication

- Login flow: `npx happyskills login --json --browser` (6-minute timeout, auto-opens browser, supports MFA, credentials never appear in terminal)
- Required for: `whoami`, `publish`, `fork`, `delete`, `visibility`, `search --mine`, `search --personal`, `search --workspace`, all `people`/`groups`/`access` commands.
- Optional for: `convert` (when not logged in, requires `--workspace`).

### Multi-Agent Support

- 8 supported agents: Claude Code, Cursor, Windsurf, Codex, GitHub Copilot, Aider, Cline, Roo Code
- Auto-detected by default. Override with `--agents` flag, `HAPPYSKILLS_AGENTS` env var, or `npx happyskills config agents <list>`.
- Physical files always live in `.agents/skills/` — every agent gets a symlink.
- See [family-overview.md § Multi-Agent Support](family-overview.md) for detail.

### Skill Format

- `SKILL.md` — Claude Code spec. Frontmatter (`name`, `description`, etc.) + body.
- `skill.json` — HappySkills manifest (name, version, description, keywords, dependencies, systemDependencies).
- `CHANGELOG.md` — version history, Keep a Changelog format.
- `references/`, `scripts/`, `assets/` — supporting files (lazy-loaded).
- Hard cap: SKILL.md ≤ 500 lines. Soft cap on description: ≤ 250 chars (new spec).
- For deep skill-format questions, route to `happyskills-design`.

### Lock Files

- `skills-lock.json` (project) or `~/.claude/skills-lock.json` (global).
- Auto-generated. Never edit manually. Commit to version control for reproducible installs.

### Storage Layout

- Canonical: `<project>/.agents/skills/<owner>/<name>/` or `~/.agents/skills/<owner>/<name>/`.
- Lock file at project root next to `.claude/`, NOT inside it.

### Pricing

- Public pricing page: point users to the website rather than quoting numbers (pricing evolves more often than this doc).

---

## When You Genuinely Don't Know

If a user asks about a feature that's not in this map:

1. **Don't fabricate.** Say "I don't know — let me check," then read [family-overview.md](family-overview.md) for product-level context, or read the SKILL.md routing tables of likely-relevant family members.
2. **If still unsure**, tell the user: "That feature might not exist yet, or it might be in a different surface (web app, API, admin panel). Want me to check the docs or do you want to ask in the HappySkills community?"
3. **Update this map** — if you discover a routing answer the user finds valuable, suggest the user ask `happyskills-design` to update this reference ("the concierge feature-map should mention X").

Never invent a CLI flag, command, or family member that isn't documented here.
