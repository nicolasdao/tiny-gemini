---
name: tiny-gemini-upkeep
description: tiny-gemini — Check the CLI, model registry, and skills against the live Gemini API, researching official sources for new models, capabilities, and breaking changes. Use when auditing if tiny-gemini is up to date. Not for looking up a known model.
argument-hint: "[optional focus e.g. models, schema, image]"
allowed-tools: Read, Grep, Glob, Bash, Edit, Write, AskUserQuestion, Task, WebSearch, WebFetch
---

# tiny-gemini-upkeep

Keeps `tiny-gemini` current with the live Google Gemini API. It checks the CLI's request schema, the model registry (`models.json`), the docs, and the sibling `tiny-gemini-*` skills against Google's **official** documentation — and goes further: it actively hunts for **new** models, capabilities, and endpoints, and for **new official sources** that are not in our registry yet (or that Google may have just shipped and barely documented).

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

## API Key

The verify / discover / reconcile / propose phases need **no** API key. **Phase 7's live smoke test** runs real `npx tiny-gemini` image + tts calls, which need a Gemini key — **managed by the CLI** (resolved from `GEMINI_API_KEY` / `.gemini/.env` / `~/.gemini/.env`; no skill-level secret). If no key is configured, run every phase **except** the live smoke test and tell the user to set `GEMINI_API_KEY` (or `~/.gemini/.env`) to complete Phase 7.

## Workflow

Work these phases in order. All paths are relative to the **project root** (the directory containing `cli.js` and `docs/`).

**Phase 1 — Load registry + baseline.** Read `docs/sources.md` (the §1 source table, the §5 currency-check procedure, and the *Last verified* date + verification log). Read the baseline you are checking against: `models.json`, and the request-shaping code in `cli.js` (`MODELS`, `SUNSET_MODELS`, `API_REVISION`, and the image/TTS body builders). The window between *Last verified* and today is what you are hunting in.

**Phase 2 — Verify known sources.** Dispatch research sub-agents, one per source cluster in `docs/sources.md` §1 (models + deprecations + pricing; interactions schema + breaking-changes; image-generation; thinking + structured-output). Prompt templates and the mandatory verbatim-extraction discipline are in [references/research-playbook.md](references/research-playbook.md).

**Phase 3 — Discover new sources + capabilities.** Dispatch open-ended discovery sub-agents (changelog-first, then new model families, new API surfaces, preview/experimental features, and official pages absent from the registry). See the discovery section of the playbook.

**Phase 4 — Reconcile.** Diff every finding against the baseline. Classify each as: new model, changed status/pricing/shutdown, schema change, new capability, or new source — each with a **confidence level and a source URL**. Re-pull anything load-bearing **verbatim** before trusting it (see the summarizer caveat below).

**Phase 5 — Propose and STOP.** Present a prioritized, reconciled report. Do **not** edit anything. Wait for the user's approval.

**Phase 6 — Apply (after approval only).** Propagate approved changes to every surface — `cli.js`, `models.json`, the docs, **and every affected skill in the constellation** (a typed model reaches its type's skill; a schema change reaches every skill whose examples show that body). The propagation map, the *which-skill-owns-which-CLI-surface* table, and the `models.json`↔`SUNSET_MODELS` lockstep rule are in [references/apply-and-verify.md](references/apply-and-verify.md).

**Phase 7 — Smoke-test + coherence check.** Verify any request/header change against the live API with a real key (one cheap `image` + one `tts` call). Then run the **coherence check**: a repo-wide sweep proving the CLI, docs, and every skill now agree — no surface still teaches an old model ID or removed field — plus `validate` on each edited skill and a `node cli.js models list` cross-check. The update is not done until both pass. Both recipes are in [references/apply-and-verify.md](references/apply-and-verify.md).

**Phase 8 — Record + hand off.** Add newly discovered official sources to `docs/sources.md`, append a Verification-log row, and bump its *Last verified* date. Then hand off (this skill never publishes): `/release-tiny-gemini` for the CLI, the HappySkills publish/sync flow for changed skills, and regenerate `doc-manifest.json`.

## Constraints

- **Research + propose; never edit before approval.** No code/doc/skill change until the user okays the reconciled findings.
- **Never trust a summarizer for a load-bearing fact.** `WebFetch` summarizes via a small model that silently drops table cells (it once hid supported aspect ratios). Re-pull verbatim — and smoke-test — before changing code. Always separate "confirmed live" from "could not verify".
- **Never remove battle-tested behavior on thin evidence.** If a proposed change contradicts a documented gotcha, treat that as a signal to verify harder, not to overwrite.
- **Keep `models.json` and `SUNSET_MODELS` (`cli.js`) in lockstep** — never update one without the other.
- **A CLI change is not done until the constellation matches it.** Every applied change propagates to the docs and every affected `tiny-gemini-*` skill; the run ends only when the coherence check proves they all agree. Never leave the CLI updated and a skill stale.
- **Cite a source URL for every proposed change.**
- **`docs/sources.md` is the single source registry** — add newly found sources there, don't scatter them across docs.
- **Never publish, release, or sync yourself** — route to `release-tiny-gemini`, `happyskills-publish`, and `happyskills-sync`.

## References

- [references/research-playbook.md](references/research-playbook.md) — sub-agent dispatch for both **verify** and **discover**, prompt templates, the structured-findings schema, and the verbatim discipline.
- [references/apply-and-verify.md](references/apply-and-verify.md) — reconciliation, the finding→file propagation map, the live smoke-test recipe, skill version/CHANGELOG bumps, `sources.md` upkeep, and the release/publish handoff.
- Data: [`docs/sources.md`](../../../docs/sources.md) — the source list this skill operates on (deliberately **not** duplicated here).
