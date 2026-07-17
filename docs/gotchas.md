---
description: Project-specific pitfalls in how the CLI builds requests, picks default models, and handles responses — Interactions-vs-generateContent schema, lowercase modality enums, array speech_config, fast preview-model deprecation, and JPEG image output.
tags: [gotchas, pitfalls, interactions, models, image, tts]
source:
  - cli.js
  - models.json
---

# Gotchas

Project-specific pitfalls that have already bitten us. Read before changing how the CLI builds requests, picks default models, or handles responses. These are lessons from real failures, not style preferences.

## The CLI targets the Interactions API, not `generateContent`

Every request goes to `POST /v1beta/interactions` (see `callAPI` in `cli.js`), **not** the older `…/models/{model}:generateContent` endpoint. The two have different schemas: snake_case fields (`response_format`, `system_instruction`) and lowercase enums on Interactions vs camelCase (`responseModalities`) and uppercase enums on `generateContent`.

**Risk:** A raw `curl` against `:generateContent` can succeed with a body that the CLI's endpoint rejects (and vice versa). The original v2.0.0 image bug was diagnosed by a working `generateContent` curl that used uppercase `"IMAGE"` — but that proved nothing about the CLI's Interactions request.

**How to apply:** When verifying or debugging, reproduce against `/v1beta/interactions` with the Interactions schema. Don't port request shapes between the two APIs.

## `response_modalities` was removed — declare the output type via `response_format`

The May 2026 Interactions migration (completed **2026-06-08**, legacy schema removed) **deleted the `response_modalities` field**. Output modality is now declared by the `type` of a `response_format` entry:

- **Image**: `response_format: { type: 'image', … }` — this same object also carries `aspect_ratio`/`image_size`.
- **TTS**: `response_format: { type: 'audio' }` — and `speech_config` stays under `generation_config` (it does **not** move into `response_format`).
- **Multiple modalities** (e.g. text + image): pass an **array** of format entries to `response_format`.

**Why the old gotcha flipped:** under the *pre*-migration schema, `response_modalities` was required and its values had to be lowercase (`['image']`/`['audio']`; uppercase `['IMAGE']` returned `400 The value 'IMAGE' is not supported`). That is why earlier CLI versions sent it. The field is now gone; sending it is at best inert and at worst a 400 on an unknown field. Setting *only* `response_modalities` and no `response_format` (the old bare-image path) can now return text instead of an image.

**How to apply:** See `runImageBatch` and `handleTTS` in `cli.js` — always send `response_format` with the right `type`, never `response_modalities`. Verified against the live API on **2026-07-16** (image + TTS round-trip both succeed under the new shape). Source: https://ai.google.dev/gemini-api/docs/interactions-breaking-changes-may-2026

## `speech_config` is an array, even for one speaker

Under the May 2026 schema, `generation_config.speech_config` must be an **array** of speaker entries — `[{ voice, language }]` — even for single-speaker TTS. A bare object is rejected. Voice names are title-case (`Kore`, `Zephyr`); the CLI capitalizes the first letter of `--voice` defensively.

**Risk:** The pre-migration shape was a plain object `{ language, voice }`; leaving it that way (or copying it from the frozen snapshot) breaks all `tts` calls.

**How to apply:** See `handleTTS` in `cli.js`. Keep the `[{ ... }]` wrapping and title-case voices.

## Preview model IDs deprecate fast — track the GA IDs

Gemini image models went `…-preview` → GA → preview-shutdown in a matter of weeks (the `gemini-3.1-flash-image-preview`/`gemini-3-pro-image-preview` previews shut down **2026-06-25**, only ~4 weeks after the GA `gemini-3.1-flash-image`/`gemini-3-pro-image` launched). Different model families sunset on **different dates** (2.5 text family 2026-10-16; `gemini-2.5-flash-image` 2026-10-02), so a single global shutdown constant is wrong.

**Risk:** Hardcoding a `-preview` model as a default leaves the CLI pointed at a model that stops serving with little warning. Assuming one shutdown date mislabels warnings.

**How to apply:** Defaults in `MODELS` should be GA IDs. `SUNSET_MODELS` carries a per-model `{ replacement, shutdown }`. When refreshing, re-check Google's deprecations page and update `models.json` + `SUNSET_MODELS` together.

## `image_size` requires an uppercase `K`

The API accepts `512`, `1K`, `2K`, `4K` — the `K` must be uppercase. Lowercase `2k` is rejected with a 400.

**Risk:** Users (and old help text) naturally type `2k`.

**How to apply:** The CLI normalizes a trailing lowercase `k` to `K` before sending (see `handleImage` in `cli.js`). Keep help text and docs showing the uppercase form.

## Extreme aspect ratios and `512px` are `gemini-3.1-flash-image`-only

The CLI advertises 14 aspect ratios, but the value set is **model-specific**. Only `gemini-3.1-flash-image` (the default) supports the four extremes `1:4`, `1:8`, `4:1`, `8:1` and the `512px` size. `gemini-3-pro-image`, the new `gemini-3.1-flash-lite-image`, and the deprecated `gemini-2.5-flash-image` accept only the 10 standard ratios (`1:1, 2:3, 3:2, 3:4, 4:3, 4:5, 5:4, 9:16, 16:9, 21:9`) and 400 on the extremes. `gemini-3.1-flash-lite-image` is additionally **1K-only** (no `512px`/`2K`/`4K`).

**Risk:** `--aspect-ratio=8:1 --model=gemini-3-pro-image` (or `--image-size=4K --model=gemini-3.1-flash-lite-image`) returns a 400. The CLI stays permissive and does **not** gate values per model — it relies on the API's clear error.

**How to apply:** Keep the full ratio list for the default model. If you pass `--model`, stick to the 10 standard ratios (and 1K) unless you are on `gemini-3.1-flash-image`. Source: https://ai.google.dev/gemini-api/docs/image-generation (per-model tables, verified 2026-07-16).

## GA image models default to JPEG; PNG is available via `mime_type`

`gemini-3.1-flash-image` / `gemini-3-pro-image` return `image/jpeg` by default. As of the current image docs, `image/png` is also selectable by setting `mime_type` on the image `response_format` entry (`{ type: 'image', mime_type: 'image/png' }`). Either way, the CLI saves using whatever `mime_type` the response carries, so the file extension always matches the actual bytes — do not hardcode `.png` **or** `.jpg`.

**Risk:** Code or docs that assume a fixed format for all image output, or force an extension, will mislabel files.

**How to apply:** Trust `item.mime_type` from the response (`extractOutputs` → `saveOutput`). Same principle for TTS audio: the PCM may be labeled `audio/pcm` or `audio/l16`, so `saveOutput` matches both and wraps as WAV. Source: https://ai.google.dev/gemini-api/docs/image-generation

## The image API returns one image per call — there is no `candidate_count`

The Interactions API has **no** parameter that returns multiple image candidates from a single request. There is no `candidate_count`, `number_of_images`, `sample_count`, or `n` on the request body; `response_format` (type `image`) only carries `mime_type`/`aspect_ratio`/`image_size`. Setting `candidateCount > 1` on the legacy `generateContent` path is hard-rejected for image models (`400: Multiple candidates is not enabled for this model`). The `sampleCount`/`numberOfImages` that *do* batch images belong to **Imagen** via `:predict` — a different model family (and deprecated, shutdown 2026-08-17).

**Risk:** Assuming you can ask for N images in one call, or trying to add a `--count`-style parameter to the request body. It will 400 or be ignored.

**How to apply:** A batch of N images (`--count`/`--styles`/`--variations`, or `story` steps) is **N independent requests**. The CLI fans them out concurrently via `mapPool` (bounded by `--concurrency`, default `DEFAULT_IMAGE_CONCURRENCY = 4`) rather than serially — see `handleImage` in `cli.js`. Don't collapse them into one call; the only API-level cost lever is the async Batch API (`:batchGenerateContent`, ~50% cheaper, ~24h turnaround), which is a separate, non-interactive path.

## Video output is delivered as a URI to download, not inline base64

The `video` command (Gemini Omni) sends `response_format: { type: 'video', delivery: 'uri' }`, so the response part is `{ type: 'video', mime_type: 'video/mp4', uri: '…/files/…:download?alt=media' }` — a **`uri`, not `data`**. Two consequences: (1) `extractOutputs` had to learn the `video` part type *and* the `uri` field (it previously only read `data` for image/audio); (2) the download endpoint **302-redirects** to a signed media URL, so the fetch must follow redirects (Node `fetch` does by default) with the `x-goog-api-key` header. The interaction completes **synchronously** — no `background: true`/polling like Deep Research; the URI is ready when `status` is `completed`.

**Risk:** Assuming video comes back as inline base64 like image/audio (it's a multi-MB blob — `uri` delivery deliberately avoids dumping it into stdout/memory), or not following the 302 (a bare GET returns a 95-byte JSON redirect stub, not the MP4).

**How to apply:** See `handleVideo`/`downloadVideoFile` in `cli.js`. Keep `delivery: 'uri'`, follow the redirect, and read the **actual** cost from `usage.output_tokens_by_modality` (video ≈ $0.10/second of 720p — pricey; there is no duration parameter, so cost can't be known before generating). Omni (`/v1beta/interactions`, synchronous) is **not** Veo (`:predictLongRunning`, long-running op) — don't conflate them.

## The `docs/manual/20260307-gemini/` snapshots are frozen and pre-migration

The files under `docs/manual/20260307-gemini/` are deliberately preserved copies of Google's docs from 2026-03-07 — *before* the May 2026 Interactions schema migration. They still show uppercase `["IMAGE"]`/`["AUDIO"]` and object-form `speech_config`.

**Risk:** Treating them as current guidance reintroduces the exact bugs above.

**How to apply:** Use them only to understand what the API looked like when the project was built. For current behavior, rely on `docs/api-reference.md`, `docs/commands.md`, and the live Google docs. Do not edit the snapshots.
