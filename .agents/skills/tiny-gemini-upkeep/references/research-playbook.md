# Research Playbook

How to run the research phase — both **verifying** the known sources and **discovering** what is not yet tracked. Dispatch sub-agents (the `Task` tool) concurrently; each is blind to the others, which is the point.

## Structured-findings schema (ask every agent to return this)

Ask each sub-agent to return findings as a list, each item carrying:

- `claim` — one sentence, the concrete fact (e.g. "gemini-3.1-flash-lite-image is GA").
- `category` — `new-model` | `status-change` | `pricing-change` | `deprecation` | `schema-change` | `new-capability` | `new-source`.
- `verdict` — `confirmed-live` | `could-not-verify`.
- `source_url` — the exact page the claim came from.
- `verbatim` — a short exact quote when the claim is load-bearing (see discipline below).
- `affects` — best guess at what it touches (`models.json`, `cli.js` schema, a doc, a skill, the registry).

Findings with `could-not-verify` are reported, never silently dropped.

## Verbatim discipline (non-negotiable)

`WebFetch` runs a small summarizing model. It **silently drops table cells** — in a prior run it hid the `1:4/1:8/4:1/8:1` aspect ratios that were actually present, which would have caused us to delete a supported feature.

Rules:
- For anything that will drive a **code change** (a request-body field, an exact enum list, a model ID, a shutdown date), require the agent to re-pull the raw content and quote it **verbatim** — via multiple fetches with a "return the raw code block / table, no paraphrase" prompt, or a raw fetch — and cross-check across at least two pulls.
- Instruct agents to report **only what the live page says**, to attach the source URL to every claim, and to say "could not verify" rather than fill from training data.
- When a finding contradicts one of our documented gotchas (`docs/gotchas.md`), that is a reason to verify harder, not to trust the summary.

## Phase 2 — Verify known sources

Read the §1 table in `docs/sources.md` and dispatch one agent per cluster. Typical clusters and what each must return:

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
- Rank by impact: schema/breaking changes first, then default-model or deprecation changes, then new models, then doc/source additions.
- For each surviving finding, name the exact file(s) it touches — that list becomes the Phase 5 proposal and the Phase 6 work.
