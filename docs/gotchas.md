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

Every request goes to `POST /v1beta/interactions` (see `callAPI` in `cli.js`), **not** the older `…/models/{model}:generateContent` endpoint. The two have different schemas: snake_case fields (`response_modalities`, `system_instruction`) and lowercase enums on Interactions vs camelCase (`responseModalities`) and uppercase enums on `generateContent`.

**Risk:** A raw `curl` against `:generateContent` can succeed with a body that the CLI's endpoint rejects (and vice versa). The original v2.0.0 image bug was diagnosed by a working `generateContent` curl that used uppercase `"IMAGE"` — but that proved nothing about the CLI's Interactions request.

**How to apply:** When verifying or debugging, reproduce against `/v1beta/interactions` with the Interactions schema. Don't port request shapes between the two APIs.

## `response_modalities` enum values are lowercase

The Interactions API requires lowercase modality strings: `text`, `image`, `audio`, `video`, `document`. Uppercase is rejected with `400 The value 'IMAGE' is not supported for 'response_modalities[0]'`.

**Risk:** Examples copied from `generateContent` docs (or our own frozen snapshots) use uppercase `["IMAGE"]`/`["AUDIO"]` and will break every image and TTS call.

**How to apply:** Image bodies use `response_modalities: ['image']`; TTS uses `['audio']`. Keep it lowercase everywhere, including doc/skill examples that an agent might paste into `raw`.

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

## GA image models return JPEG, not PNG

`gemini-3.1-flash-image` / `gemini-3-pro-image` return `image/jpeg`, not PNG. The CLI saves using whatever `mime_type` the response carries, so the file extension always matches — do not hardcode `.png`.

**Risk:** Code or docs that assume `image/png` for all image output, or force a `.png` extension, will mislabel files.

**How to apply:** Trust `item.mime_type` from the response (`extractOutputs` → `saveOutput`). Same principle for TTS audio: the PCM may be labeled `audio/pcm` or `audio/l16`, so `saveOutput` matches both and wraps as WAV.

## The `docs/manual/20260307-gemini/` snapshots are frozen and pre-migration

The files under `docs/manual/20260307-gemini/` are deliberately preserved copies of Google's docs from 2026-03-07 — *before* the May 2026 Interactions schema migration. They still show uppercase `["IMAGE"]`/`["AUDIO"]` and object-form `speech_config`.

**Risk:** Treating them as current guidance reintroduces the exact bugs above.

**How to apply:** Use them only to understand what the API looked like when the project was built. For current behavior, rely on `docs/api-reference.md`, `docs/commands.md`, and the live Google docs. Do not edit the snapshots.
