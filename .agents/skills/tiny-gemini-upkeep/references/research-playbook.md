# Research Playbook

How to run the research phase — both **verifying** the known sources and **discovering** what is not yet tracked. Dispatch sub-agents (the `Task` tool) concurrently; each is blind to the others, which is the point.

## Structured-findings schema (ask every agent to return this)

Ask each sub-agent to return findings as a list, each item carrying:

- `claim` — one sentence, the concrete fact (e.g. "gemini-3.1-flash-lite-image is GA").
- `category` — `new-model` | `status-change` | `pricing-change` | `deprecation` | `deprecating-soon` | `broken` | `schema-change` | `new-capability` | `removed-capability` | `new-source`.
- `class` — the handling class (see SKILL.md "Three finding classes"): `resolve` (currency fix upkeep applies) | `migrate` (a used API is broken/replaced/deprecating-soon → migrate to the replacement, preserving the plain-English capability) | `decide` (a new or removed capability, or a migration that can't preserve the capability → surface for the principal, never auto-apply).
- `verdict` — `confirmed-live` | `could-not-verify`.
- `source_url` — the exact page the claim came from.
- `verbatim` — a short exact quote when the claim is load-bearing (see discipline below).
- `affects` — best guess at what it touches (`models.json`, `cli.js` schema, a doc, a skill, the registry).
- For `deprecating-soon` / `broken`: the **recommended replacement** (ID or shape) and the source that names it, so Phase 6 can migrate.
- For `new-capability`: *what it does*, *how it works*, and its *value proposition* — enough for the principal to decide integration (this feeds the Class 3 template). For `removed-capability`: *what is lost* and the source confirming it's gone.

Findings with `could-not-verify` are reported, never silently dropped.

## Verbatim discipline (non-negotiable)

`WebFetch` runs a small summarizing model. It **silently drops table cells** — in a prior run it hid the `1:4/1:8/4:1/8:1` aspect ratios that were actually present, which would have caused us to delete a supported feature.

Rules:
- For anything that will drive a **code change** (a request-body field, an exact enum list, a model ID, a shutdown date), require the agent to re-pull the raw content and quote it **verbatim** — via multiple fetches with a "return the raw code block / table, no paraphrase" prompt, or a raw fetch — and cross-check across at least two pulls.
- Instruct agents to report **only what the live page says**, to attach the source URL to every claim, and to say "could not verify" rather than fill from training data.
- When a finding contradicts one of our documented gotchas (`docs/gotchas.md`), that is a reason to verify harder, not to trust the summary.

## Phase 2 — Verify our usage + hunt deprecation

**First, build the usage inventory.** Read `cli.js` and `models.json` and list everything the CLI *actually depends on*: the endpoint (`/v1beta/interactions`), the headers (`x-goog-api-key`, `Api-Revision`), the default models (`MODELS`) and `SUNSET_MODELS`, every request-body shape per command (image `response_format:{type:image}`, TTS `response_format:{type:audio}`+`speech_config`, text/schema, `tools:[{google_search}]`, research `agent`+`background`), the SSE event names, and every model ID in the registry. This inventory is the checklist — the goal is a diff against *our* usage, not a survey of the docs.

Then dispatch one agent per source cluster in `docs/sources.md` §1. For **every** inventory item each agent must answer four questions:
1. **Still works?** Is it still valid on the live docs, unchanged?
2. **Changed / replaced / already broken?** New shape, new required field, renamed, or removed.
3. **Deprecating soon?** Hunt the deprecation signals: an announced `shutdown_on` date, a "recommended replacement" / "use X instead", a preview→GA transition that sunsets the preview, a changelog "deprecated"/"will be removed" note. A soon-to-deprecate dependency is a **`migrate`** finding *now*, before it breaks.
4. **No longer possible?** Something the CLI does that the API no longer supports at all (a `removed-capability` → Class 3).

Typical clusters and what each must return:

| Agent | Pages (from `docs/sources.md` §1) | Must return |
|-------|-----------------------------------|-------------|
| Models + lifecycle | models, per-model pages, deprecations, pricing | Every current model ID with type/status; for each ID we ship, confirm/refute it still exists + its status/shutdown/replacement/pricing; flag any model newer than our snapshot date |
| Interactions schema | interactions, interactions-breaking-changes, changelog | Confirm endpoint, `x-goog-api-key`, the `response_format` type entries (image/audio/text), `speech_config` placement, `thinking_level`, `google_search`, `agent`+`background`, the `steps` response, SSE event names — flag any migration after the last one |
| Image generation | image-generation, per-model image pages | Current image models, per-model aspect-ratio/size tables (verbatim), reference-image limits, MIME types, multi-image-per-call behavior |
| Config surfaces | thinking, structured-output, api-key | `thinking_level` values + defaults, `response_format` structured-output shape, key/env conventions |

Give each agent the exact model IDs and request shapes we currently ship (read from `models.json` and `cli.js`) and ask it to **confirm or refute each**, so the output is a diff, not a essay.

## Phase 3 — Discover new sources + capabilities

The registry is a floor, not a ceiling. These agents must NOT assume `docs/sources.md` is complete.

1. **Changelog-first.** Read the Gemini API changelog and list everything dated after the registry's *Last verified* date. That is the shortlist of what moved.
2. **New model families.** Search for the newest Gemini model announcements (AI Studio, DeepMind model pages, the Google/DeepMind blogs) and compare against `models.json`. Flag any family, tier, or codename we do not carry (e.g. a new image/TTS/text tier, a new agent).
3. **New API surfaces.** Look for endpoints, tools, or request fields the CLI does not use yet (new built-in tools, new `response_format` types, new background/agent capabilities, live/streaming APIs). The CLI's `raw` command already covers 100% of the API, so "new capability" usually means a doc/skill update, not new code — call that out.
4. **Preview / experimental.** Explicitly hunt for preview or experimental features that may be barely documented or announced ahead of docs (blog posts, release notes, model cards). Mark these `could-not-verify` unless there is an official page.
5. **New official sources.** Any first-party page not already in `docs/sources.md` §1/§2 is a `new-source` finding — capture its URL, what it covers, and what in the repo it would drive. These get folded into the registry in Phase 8.

Dispatch discovery agents with deliberately broad prompts (WebSearch + WebFetch), each on a different angle (by model family, by capability, by announcement recency) so they surface different things.

## Reconciliation notes for Phase 4

- Collapse duplicate claims from multiple agents; keep the one with the strongest evidence (verbatim + confirmed-live wins).
- **Assign each finding a class** (SKILL.md "Three finding classes"):
  - `resolve` — currency: still-works confirmations, metadata changes, and a new model that fits an existing command or the catalog.
  - `migrate` — a used API/model that is broken, replaced, or deprecating-soon. Attach the recommended replacement. Test the migration against the **agentic-breaking rule**: if the documented plain-English capability can be preserved (only the model ID / header / body shape changes), it stays `migrate`; if the capability itself must change, promote it to `decide`.
  - `decide` — a new capability/modality/command, a `removed-capability`, or a migration that can't preserve the capability. These are surfaced, never auto-applied.
- Rank within-class by impact: broken-now > deprecating-soon > schema change > default-model change > new model > doc/source addition.
- For each `resolve`/`migrate` finding, name the exact file(s) it touches (that list drives Phase 6). For each `decide` finding, gather the material the Class 3 templates need (what/how/value, or what's-lost/impact/options).
