---
name: tiny-gemini-upkeep
description: tiny-gemini — Audit the CLI, registry, and skills against the live Gemini API — verify usage works, migrate deprecated/broken APIs, and surface new/removed capabilities to decide. Use when auditing tiny-gemini currency. Not for model lookup.
argument-hint: "[optional focus e.g. models, schema, image]"
allowed-tools: Read, Grep, Glob, Bash, Edit, Write, AskUserQuestion, Task, WebSearch, WebFetch
---

# tiny-gemini-upkeep

Keeps `tiny-gemini` current with the live Google Gemini API — and keeps it **working**. It does three jobs:

1. **Verify + migrate** — confirm that every API, endpoint, header, model, and request shape the CLI *actually uses* still works, and **migrate** anything broken, replaced, or deprecating soon to its recommended replacement — ideally without breaking anything.
2. **Discover** — hunt for new models, capabilities, endpoints, and **official sources** not yet tracked (things Google may have just shipped and barely documented).
3. **Surface for decision** — present any genuinely new capability worth integrating, and any capability that is no longer possible, so the **principal** (you) — not the tool — decides scope changes.

Run it periodically, before a release, or whenever you suspect the API or model lineup has moved.

## When this runs

Auto-invoke on intents like *"is tiny-gemini up to date"*, *"did Gemini ship new models"*, *"check for Gemini breaking changes"*, *"refresh models.json"*, *"audit our Gemini API usage"*. User-invoke with `/tiny-gemini-upkeep [focus]`, where an optional focus (`models`, `schema`, `image`, …) narrows the check; no argument runs the full sweep.

This skill **researches and proposes**. It does **not** edit `cli.js`, `models.json`, `docs/`, or any skill until you approve the reconciled findings.

## Core principle — the registry is a starting point, not a fence

The source registry [`docs/sources.md`](../../../docs/sources.md) lists what we already track. But **sources change, and new sources appear** — a new model family, a new endpoint, a preview capability, or a fresh official page that did not exist at the last check. So every run does BOTH:

1. **Verify** the known sources for changes: new models, status transitions (preview→GA), deprecations, pricing changes, and breaking API/schema changes.
2. **Discover** — open-ended research that does **not** assume the registry is complete: find models, capabilities, endpoints, and **official sources** not yet in `docs/sources.md`, then fold the genuinely-new official ones back into the registry.

Discovery is not optional. A run that only re-reads the known pages will miss exactly the things this skill exists to catch.

## Core principle — the CLI and the constellation are one system

`tiny-gemini` is the CLI **and** the `tiny-gemini-*` skill constellation that teaches agents to use it (`tiny-gemini` core, `-image`, `-tts`, `-models`, `-research`) plus the docs. A currency update is only done when **all of them agree**. A new model the CLI accepts but the image skill never names, or a field the CLI dropped but `raw-api.md` still shows, is an incoherent system — the exact failure this skill exists to prevent. So every applied change propagates from the CLI to the docs to **every affected skill**, and the run ends with a coherence check that proves they now tell the same story. The *which-skill-owns-which-CLI-surface* map and the coherence check are in [references/apply-and-verify.md](references/apply-and-verify.md).

## Three finding classes — resolve, migrate, or decide

Every finding falls into one of three classes, and the class decides whether upkeep fixes it (with your approval) or surfaces it for **your** decision. This split is the heart of the skill.

**Class 1 — Resolve (currency; upkeep proposes, then applies once approved).** Keeps our *existing* surface correct without changing what the CLI can do:
- An API, endpoint, header, model, or request field the CLI uses still works → confirm, no change.
- Changed metadata (status, pricing, shutdown date) → update `models.json` + docs.
- A new model that fits an existing command or belongs in the catalog → add to `models.json` (+ the type's skill + docs). A model in the catalog is currency even when no command wraps it — the registry is a catalog and `tiny-gemini models` is discovery.

**Class 2 — Migrate (a used API is broken, replaced, or deprecating soon; upkeep migrates, preserving the capability).** If something the CLI *depends on* is already broken/removed, now has a replacement, or your research predicts an imminent deprecation:
- Find the **recommended replacement** and migrate to it proactively — before the shutdown date, not after it breaks.
- **Preserve the plain-English capability; change only the implementation.** In agentic tooling the contract is the capability the skill *documents* ("generate an image from a prompt"), not the exact request body. Swapping a model ID, a header, or a request-body shape while that documented capability stays identical is **low-risk** — the agent adapts the nitty-gritty at runtime. Prefer these invisible-to-intent migrations, and aim to break nothing.
- If a migration **cannot** preserve the capability (the replacement genuinely does less, or a user-facing behavior/output must change), that is a *true* breaking change in the agentic sense → do **not** silently apply it; move it to Class 3.

**Class 3 — Decide (scope changes; surface richly, the principal decides, upkeep never auto-applies).** Adding or removing what the CLI *can do* is the principal's call, not a maintenance tool's:
- **A new capability, modality, or command family** (e.g. video via Omni Flash, Managed Agents, Computer Use): present *what it does*, *how it works*, its *value proposition*, and a *proposed integration shape* (catalog entry? new flag/command? new satellite skill via `happyskills-design`?) — enough for the principal to decide whether and how to integrate it into the CLI + skills.
- **A capability that is no longer possible at all** (removed upstream, no replacement): present *what is lost*, the *blast radius* (which command/flag/skill relies on it), and *options* (remove it, or document it as unavailable) — so the principal decides whether and how to remove it.
- **A true-breaking migration** (Class 2 could not preserve the capability): present the before/after behavior and let the principal approve.

Upkeep never **expands** scope (adds a modality/command/skill) or **removes** scope (drops a command/flag) on its own — it resolves currency, migrates to keep things working, and surfaces everything else as a decision. Presentation templates for Class 3 are in [references/apply-and-verify.md](references/apply-and-verify.md).

## API Key

The verify / discover / reconcile / propose phases need **no** API key. **Phase 7's live smoke test** runs real `npx tiny-gemini` image + tts calls, which need a Gemini key — **managed by the CLI** (resolved from `GEMINI_API_KEY` / `.gemini/.env` / `~/.gemini/.env`; no skill-level secret). If no key is configured, run every phase **except** the live smoke test and tell the user to set `GEMINI_API_KEY` (or `~/.gemini/.env`) to complete Phase 7.

## Workflow

Work these phases in order. All paths are relative to the **project root** (the directory containing `cli.js` and `docs/`).

**Phase 1 — Load registry + baseline.** Read `docs/sources.md` (the §1 source table, the §5 currency-check procedure, and the *Last verified* date + verification log). Read the baseline you are checking against: `models.json`, and the request-shaping code in `cli.js` (`MODELS`, `SUNSET_MODELS`, `API_REVISION`, and the image/TTS body builders). The window between *Last verified* and today is what you are hunting in.

**Phase 2 — Verify our usage + hunt deprecation.** For every API, endpoint, header, model, and request shape the CLI *actually uses* (enumerate them from `cli.js` and `models.json` in Phase 1), dispatch research sub-agents to confirm against the live docs: does it still work, has it changed, is it already deprecated or replaced, and — critically — does any signal (an announced shutdown date, a "recommended replacement", a preview→GA shift, a changelog deprecation, "will be removed" language) predict it will be deprecated **soon**? Also check whether anything the CLI does is **no longer possible** at all. Cover the source clusters in `docs/sources.md` §1. Prompt templates and the mandatory verbatim discipline are in [references/research-playbook.md](references/research-playbook.md).

**Phase 3 — Discover new sources + capabilities.** Dispatch open-ended discovery sub-agents (changelog-first, then new model families, new API surfaces, preview/experimental features, and official pages absent from the registry). See the discovery section of the playbook.

**Phase 4 — Reconcile and classify.** Diff every finding against the baseline and sort each into one of the three classes — **Resolve** (currency), **Migrate** (a broken/replaced/soon-deprecated dependency), or **Decide** (a new or removed capability, or a true-breaking migration) — each with a confidence level and a source URL. Re-pull anything load-bearing **verbatim** before trusting it (see the summarizer caveat below).

**Phase 5 — Propose and STOP.** Present two clearly separated sections and wait for approval: **(a) Proposed changes** — the Class 1 currency fixes and Class 2 migrations you will apply; **(b) Decisions for you** — every Class 3 item, each presented richly per the templates in [references/apply-and-verify.md](references/apply-and-verify.md) (new capability → what it does / how it works / value proposition / proposed integration shape; removed capability → what's lost / blast radius / options). Do **not** edit anything, and never fold a Class 3 scope change into the Class 1/2 changes.

**Phase 6 — Apply (after approval only).** Apply the approved Class 1 fixes and Class 2 migrations to every surface — `cli.js`, `models.json`, the docs, **and every affected skill** (a typed model reaches its type's skill; a schema/migration change reaches every skill whose examples show that body). A Class 2 migration must leave the documented plain-English capability **unchanged** across all surfaces. Apply a Class 3 change only if the principal explicitly chose to integrate or remove it — otherwise leave scope untouched. The propagation map, the ownership table, the `models.json`↔`SUNSET_MODELS` lockstep rule, and the migration playbook are in [references/apply-and-verify.md](references/apply-and-verify.md).

**Phase 7 — Smoke-test + coherence check.** Verify any request/header change against the live API with a real key (one cheap `image` + one `tts` call). Then run the **coherence check**: a repo-wide sweep proving the CLI, docs, and every skill now agree — no surface still teaches an old model ID or removed field — plus `validate` on each edited skill and a `node cli.js models list` cross-check. The update is not done until both pass. Both recipes are in [references/apply-and-verify.md](references/apply-and-verify.md).

**Phase 8 — Record + hand off.** Add newly discovered official sources to `docs/sources.md`, append a Verification-log row, and bump its *Last verified* date. Then hand off (this skill never publishes): `/release-tiny-gemini` for the CLI, the HappySkills publish/sync flow for changed skills, and regenerate `doc-manifest.json`.

## Constraints

- **Research + propose; never edit before approval.** No code/doc/skill change until the user okays the reconciled findings.
- **Never trust a summarizer for a load-bearing fact.** `WebFetch` summarizes via a small model that silently drops table cells (it once hid supported aspect ratios). Re-pull verbatim — and smoke-test — before changing code. Always separate "confirmed live" from "could not verify".
- **Never remove battle-tested behavior on thin evidence.** If a proposed change contradicts a documented gotcha, treat that as a signal to verify harder, not to overwrite.
- **Migrate to keep working, preserving the capability.** When a used API is broken, replaced, or deprecating soon, migrate to the recommended replacement — change only the implementation (model ID, header, request-body shape) and keep the documented plain-English capability identical. A migration that can't preserve the capability is a Class 3 decision, not a silent edit.
- **Never expand or remove scope on your own.** A new capability/modality/command, a dropped capability, and a true-breaking migration are Class 3 — surface them richly (what/how/value, or what's-lost/impact/options) for the principal to decide. Never auto-integrate a new modality or auto-remove an existing command/flag.
- **Keep `models.json` and `SUNSET_MODELS` (`cli.js`) in lockstep** — never update one without the other.
- **A CLI change is not done until the constellation matches it.** Every applied change propagates to the docs and every affected `tiny-gemini-*` skill; the run ends only when the coherence check proves they all agree. Never leave the CLI updated and a skill stale.
- **Cite a source URL for every proposed change.**
- **`docs/sources.md` is the single source registry** — add newly found sources there, don't scatter them across docs.
- **Never publish, release, or sync yourself** — route to `release-tiny-gemini`, `happyskills-publish`, and `happyskills-sync`.

## References

- [references/research-playbook.md](references/research-playbook.md) — sub-agent dispatch for both **verify** and **discover**, prompt templates, the structured-findings schema, and the verbatim discipline.
- [references/apply-and-verify.md](references/apply-and-verify.md) — the finding→file propagation map, the **Class 2 migration playbook**, the **Class 3 decision templates** (new-capability and removed-capability presentation formats), the live smoke-test recipe, the coherence check, skill version/CHANGELOG bumps, `sources.md` upkeep, and the release/publish handoff.
- Data: [`docs/sources.md`](../../../docs/sources.md) — the source list this skill operates on (deliberately **not** duplicated here).
