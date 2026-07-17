---
description: The single canonical registry of every external source this project is built on — official Gemini API docs, model/pricing/deprecation pages, prompting guides, auth conventions, and local snapshots — plus the step-by-step procedure for checking that the CLI and skills are still up to date. Designed to be consumed by a future "check-currency" skill.
tags: [sources, references, monitoring, models, api, currency-check]
source:
  - cli.js
  - models.json
---

# Sources

This is the **single source of truth** for every external reference `tiny-gemini` is built on. If a source is not listed here, it is not a source of record — add it here first. When any of these pages change, the CLI's request shapes (`cli.js`), model registry (`models.json`), docs (`docs/`), and the skill constellation (`.agents/skills/`) may need updating.

- **Primary monitoring feed:** the [Gemini API changelog](https://ai.google.dev/gemini-api/docs/changelog) — start every currency check there, then drill into the specific pages below for anything it flags.
- **Last verified against live docs:** **2026-07-17** (see [Verification log](#verification-log)).
- **All docs snapshotted here reflect the post-May-2026 Interactions schema** (legacy schema removed 2026-06-08). The frozen copies under `docs/manual/` predate that migration and are **not** current — see [Gotchas](gotchas.md).

## 1. Primary API & model sources (canonical — monitor these)

| # | Source | URL | Drives in this repo | What to check |
|---|--------|-----|---------------------|---------------|
| 1 | **Changelog** (primary feed) | https://ai.google.dev/gemini-api/docs/changelog | Everything — the earliest signal | New/renamed models, schema changes, new capabilities, breaking changes |
| 2 | Models | https://ai.google.dev/gemini-api/docs/models | `models.json`, `MODELS` defaults (`cli.js`), model docs | New model IDs, status transitions (preview→GA), capabilities |
| 2a | Per-model pages | `https://ai.google.dev/gemini-api/docs/models/<model-id>` (e.g. `…/gemini-3.1-flash-image`) | `models.json` capabilities, per-model aspect-ratio/size tables | Model-specific limits (ratios, sizes, reference-image counts) that the models overview omits |
| 3 | Deprecations | https://ai.google.dev/gemini-api/docs/deprecations | `SUNSET_MODELS` (`cli.js`), `deprecated_on`/`shutdown_on`/`replacement` (`models.json`) | Shutdown dates + recommended replacements (dates differ per model family) |
| 4 | Pricing | https://ai.google.dev/gemini-api/docs/pricing | `pricing` blocks in `models.json`, cost estimation (`imageCostUsd`) | Input/output $/1M, per-image costs, tiered/cache pricing |
| 5 | Interactions API | https://ai.google.dev/gemini-api/docs/interactions | `callAPI`/`callAPIStream`/`apiHeaders` (`cli.js`), `docs/api-reference.md` | Endpoint, request/response schema, tools, background tasks |
| 5a | Interactions text-generation | https://ai.google.dev/gemini-api/docs/interactions/text-generation | Auth header, streaming examples | Canonical `x-goog-api-key` + SSE event names |
| 6 | Interactions breaking changes (May 2026) | https://ai.google.dev/gemini-api/docs/interactions-breaking-changes-may-2026 | The whole request-body shape (`response_format` vs the removed `response_modalities`), `API_REVISION` | Any *further* schema migration; the `Api-Revision` timeline |
| 7 | Image Generation | https://ai.google.dev/gemini-api/docs/image-generation | `handleImage`/`runImageBatch` (`cli.js`), `docs/commands.md`, image skill | Image models, per-model aspect-ratio/size tables, reference-image limits, MIME types |
| 8 | Thinking | https://ai.google.dev/gemini-api/docs/thinking | `thinking_level` handling, `docs/api-reference.md` | Valid `thinking_level` values and per-model defaults |
| 9 | Structured Output | https://ai.google.dev/gemini-api/docs/structured-output | `--schema` → `response_format` (`handlePrompt`) | The `{ type:"text", mime_type:"application/json", schema }` shape |
| 10 | API Keys | https://ai.google.dev/gemini-api/docs/api-key | Config resolution, key env-var order (`cli.js`) | Supported env vars / key conventions |
| 11 | Gemini CLI Authentication | https://github.com/google-gemini/gemini-cli/blob/main/docs/get-started/authentication.md | The `.gemini/.env` loader (`cli.js`) | The `.gemini/.env` file convention |

## 1b. Adjacent surfaces to monitor (reachable via `raw`, no dedicated command)

Gemini capabilities the CLI does **not** wrap with a dedicated command, but which are reachable via `raw` and worth monitoring. Surfaced by the 2026-07-16 discovery pass. Tracking them keeps the "`raw` covers 100%" claim honest and gives the next currency check a head start.

| Surface | ID / entry point | URL | Notes |
|---------|------------------|-----|-------|
| Managed Agents API + Antigravity agent | `antigravity-preview-05-2026` | https://ai.google.dev/gemini-api/docs/custom-agents (+ `/docs/agents`, `/docs/agent-environment`) | Autonomous stateful agents in a Google-hosted sandbox. Public preview 2026-05-19. Distinct from Deep Research. |
| Computer Use tool | tool `computer_use` (model `gemini-3.5-flash`) | https://ai.google.dev/gemini-api/docs/computer-use | Virtual screen / keyboard / mouse. Public preview 2026-06-24. |
| Gemini Omni Flash (video) | `gemini-omni-flash-preview` | https://ai.google.dev/gemini-api/docs/omni (+ `/docs/models/gemini-omni-flash`) | Text/image → 3–10s 720p video. Preview 2026-06-30. Wrapped by the `video` command (added 2026-07-17). |
| File Search (RAG) tool | tool `file_search` | https://ai.google.dev/gemini-api/docs/file-search | Grounded generation over uploaded docs; needs a File Search Store first. Reachable via `raw` as a `tools` entry. Surfaced by the 2026-07-17 discovery pass. |

**Watching:** `gemini-3.5-pro` (flagship, ~2M-token context) was rumored for ~2026-07-17 but is **not** on the official models/changelog pages as of 2026-07-16 — could-not-verify. Check the changelog before adding it to `models.json`.

**Open scope decision:** whether to give any of these a dedicated CLI command + satellite skill is a product decision. If yes, route to `happyskills-design` (Constellation Pattern) so the new skill stays orthogonal.

## 2. Prompting & model guidance (secondary — inform behavior, not schema)

| Source | URL | Used by |
|--------|-----|---------|
| Nano Banana Pro prompting tips (Google blog) | https://blog.google/products-and-platforms/products/gemini/prompting-tips-nano-banana-pro/ | Reference-image prompting (Image A/B/C convention) — `handleImage`, image skill |
| Gemini image prompt guide (DeepMind) | https://deepmind.google/models/gemini-image/prompt-guide/ | Multi-image prompting guidance |
| Nano Banana 2 Lite model page (DeepMind) | https://deepmind.google/models/gemini-image/flash-lite/ | `gemini-3.1-flash-lite-image` capabilities |
| DeepMind Gemini model hub | https://deepmind.google/models/gemini/ | Tier-tracking / "coming soon" signal for new model families (e.g. 3.5 Pro) |

## 3. Setup / tooling references

| Source | URL | Purpose |
|--------|-----|---------|
| Google AI Studio (get an API key) | https://aistudio.google.com/app/apikey | Where users obtain `GEMINI_API_KEY` |
| Official Gemini CLI (repo) | https://github.com/google-gemini/gemini-cli | The heavier tool `tiny-gemini` is a lightweight alternative to |
| Keep a Changelog | https://keepachangelog.com/en/1.1.0/ | CHANGELOG format (CLI + each skill) |
| Semantic Versioning | https://semver.org/spec/v2.0.0.html | Versioning of the CLI and skills |

## 4. Local frozen snapshots (historical — do not treat as current)

Preserved copies of Google's docs from **2026-03-07**, *before* the May 2026 Interactions migration. Kept only to show the API state the project was first built against. They still show the removed `response_modalities` field and object-form `speech_config` — never copy from them. See [Gotchas](gotchas.md).

| Snapshot | Live equivalent |
|----------|-----------------|
| [docs/manual/20260307-gemini/interactions.md](manual/20260307-gemini/interactions.md) | Source #5 above |
| [docs/manual/20260307-gemini/image-generation.md](manual/20260307-gemini/image-generation.md) | Source #7 above |

## 5. Currency-check procedure

The repeatable recipe for "make sure we're up to date." The **`/tiny-gemini-upkeep` Claude Code skill automates exactly these steps** — invoke it (or just ask *"is tiny-gemini up to date?"*) and it fans out research sub-agents per source, discovers sources not yet in this registry, reconciles against the code, smoke-tests, and proposes updates before editing anything. Run the steps below by hand if you prefer, or to understand what the skill does. See [README § Keeping Current](../README.md#keeping-current).

1. **Scan the changelog** (source #1) for anything dated after the *Last verified* date at the top of this file. That is the shortlist of what changed.
2. **Models & lifecycle** (sources #2, #2a, #3, #4): for every model in `models.json`, confirm it still exists and its status/shutdown-date/replacement/pricing are unchanged. Flag any **new** model (especially image/text/TTS defaults). Update `models.json` **and** `SUNSET_MODELS` in `cli.js` **together**.
3. **Request schema** (sources #5, #5a, #6): confirm the endpoint, `x-goog-api-key`, `response_format` type entries (image/audio/text), `speech_config` placement, `thinking_level`, `google_search`, `agent`+`background`, the `steps` response, and SSE event names still match `cli.js`. Watch source #6 for any migration *after* the May 2026 one.
4. **Image specifics** (sources #7, #2a): per-model aspect-ratio/size tables, reference-image limits, MIME types.
5. **Beware summarizers.** `WebFetch` runs a small summarizing model that silently drops table cells (it once hid the `1:4/1:8/4:1/8:1` ratios). When a decision hinges on an exact list or request body, re-pull **verbatim** (raw fetch / multiple passes) before changing code.
6. **Smoke-test any request-shape change** against the live API with a real key (one cheap `image` + one `tts` call) before committing — docs alone are not proof the body is accepted.
7. **Propagate to every surface:** `cli.js`, `models.json`, `docs/` (api-reference, commands, gotchas, model-selection, prompt-engineering, and this file's *Last verified* date + [Verification log](#verification-log)), and the skill constellation (`.agents/skills/tiny-gemini*`, with CHANGELOG + `skill.json` version bumps).
8. **Release & publish:** run `/release-tiny-gemini` for the CLI; run the HappySkills publish/sync flow to republish changed skills and regenerate `skills-lock.json`; regenerate `doc-manifest.json`.

## Verification log

| Date | Scope | Outcome |
|------|-------|---------|
| 2026-07-17 | Omni video best-practices deep-dive + reference-image support | Exhaustively mined the Omni docs (https://ai.google.dev/gemini-api/docs/omni) + the Gemini image prompting guides. Added reference-image steering to the `video` command: `--first-frame` (`<FIRST_FRAME>`), `--file` refs (`<IMAGE_REF_0..N>`), `--task` (`video_config.task`), images-before-text ordering, `background/stream:false`. Baked the full prompting playbook (tags, timed segments, promptable audio, cinematographer detail, negatives-in-prompt, region limits) into the `tiny-gemini-video` skill. Live-verified `reference_to_video` round-trip (task field accepted; 2 reference images; ≈ $1.03/clip). |
| 2026-07-17 | Upkeep run (verify + discover) + video integration | Verify: no API/model/schema change since 2026-07-16 (changelog stops at Jul 6; all shipped model IDs/statuses/dates/prices re-confirmed; `gemini-3.5-pro` still not official). Discover: registered the File Search tool + DeepMind model hub sources. **Integrated video (principal-approved Class 3):** added the `gemini-omni-flash-preview` catalog entry and a new `video` command + `tiny-gemini-video` satellite skill, live-verified end-to-end against the API (text→video round-trip; URI delivery + redirect download confirmed; actual smoke-test cost ≈ $1.02/clip). |
| 2026-07-16 | Upkeep run (verify + discover) | No API/model changes since the earlier same-day check. Added `gemini-2.5-pro-preview-tts` to the registry (verbatim-verified $1.00/$20.00, Preview, no free tier); documented streaming TTS (2026-06-17); recorded adjacent surfaces (Managed Agents/Antigravity, Computer Use, Omni Flash) in §1b; corrected a stale "deprecated" label on `gemini-2.5-flash-preview-tts`; flagged `gemini-3.5-pro` as unconfirmed. |
| 2026-07-16 | Full check (sources #1–#11) | Schema migrated off removed `response_modalities` → `response_format`; added GA `gemini-3.1-flash-lite-image`; confirmed all other model IDs + 2.5-family shutdown dates; documented per-model aspect-ratio limits. Live-verified image + TTS. |
| 2026-06-08 | Model registry snapshot (`models.json`) | Prior snapshot baseline. |
