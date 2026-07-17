---
name: tiny-gemini-video
description: tiny-gemini — Generate and edit short videos from text or reference images via the Gemini Omni model in the npx CLI. Use for video clips, animating a photo, or style/subject references. Not for images, text, audio, or research.
allowed-tools: Bash, Read
---

# tiny-gemini-video — Text/image → video generation and editing

Use the `npx tiny-gemini video` command to generate and edit short videos with the Google Gemini Omni Flash model. Part of the [tiny-gemini](../tiny-gemini/SKILL.md) suite.

**This skill is the captain of the video primitive.** The user tells you *what* they want ("a cinematic clip of my logo dissolving into smoke"); you translate that into the request shape and the prompt that gets the best result from Omni. The best-practices playbook below is the value you add — apply it even when the user doesn't ask for it.

## Scope

| User intent | How to serve it |
|-------------|-----------------|
| "make / create / generate a video of X" | `video "<rich prompt>"` |
| "animate this photo / start from this image" | `video "<prompt>" --first-frame img.png` |
| "use these images for style / the character / the product" | `video "<prompt with <IMAGE_REF_0> …>" --file a.png --file b.png` |
| "portrait / vertical / for phones" | `--aspect-ratio=9:16` |
| "edit / restyle / change this video" | `video edit clip.mp4 "<change>, keep everything else the same"` |
| "refine / continue the clip we just made" | `video "<change>" --previous=<interaction-id>` |

### What NOT to handle here

| Sibling intent | Where it lives |
|----------------|----------------|
| Still images (generate/edit/describe) | `tiny-gemini-image` |
| Text Q&A, summarization, search | Core `tiny-gemini` skill |
| Speech / narration audio (WAV) | `tiny-gemini-tts` |
| Model lookup / pricing | `tiny-gemini-models` |
| Higher-fidelity / longer cinematic video (Veo) | Core `raw` — Veo is a **separate** API (`:predictLongRunning`), not Omni |

## The model and its hard facts

`gemini-omni-flash-preview` (Omni Flash, preview). Same synchronous `/v1beta/interactions` endpoint the rest of the CLI uses — the clip returns in one call. Know these, because they bound what's possible:

- **Output:** MP4, **720p, 24fps, 3–10s**, **16:9** (default) or **9:16** — those are the *only* two aspect ratios. Duration/resolution/fps are **not** controllable.
- **Audio is generated too.** The output is **not silent** — Omni scores the clip. If you don't direct the audio, you get whatever it picks. So *always* describe the audio (or say "no audio"/"no dialogue").
- **English** is the only fully-supported prompt language.
- Every clip carries an invisible **SynthID** watermark.
- **Cost ≈ $0.10 per second of 720p** (billed per output token; a 3–10s clip ≈ **$0.30–$1.00**), **no free tier**. Confirm before generating batches; the CLI prints the *actual* cost after each run.

## Reference images — the biggest quality lever

Omni accepts **images** as input to steer generation (no stated max; up to ~6 is demonstrated). There are three distinct roles — pick the right flag/tag:

| Role | Flag | Prompt tag | Meaning |
|------|------|-----------|---------|
| **First frame** | `--first-frame img.png` | `<FIRST_FRAME>` | The video literally *starts* from this exact image and animates forward |
| **Style / subject reference** | `--file img.png` (repeatable) | `<IMAGE_REF_0>`, `<IMAGE_REF_1>`, … | Use the image as a *reference* (a style to imitate, a character/product to keep consistent) — **not** rendered as a literal frame |

**How the tags bind:** `--file` images map to `<IMAGE_REF_0>`, `<IMAGE_REF_1>`, … **in the order you pass them** (0-indexed). `--first-frame` maps to `<FIRST_FRAME>`. **The CLI prints the tag→file mapping to stderr** on every run — read it, then place the tags in your prompt where each image should be used:

```bash
# style + subject references, referenced inline in the prompt
npx tiny-gemini video "in the style of <IMAGE_REF_0>, <IMAGE_REF_1> walks toward camera through neon rain, cinematic" \
  --file style=neon_art.png --file subject=model.png

# animate FROM a starting image
npx tiny-gemini video "the logo slowly dissolves into drifting smoke, soft whoosh" --first-frame logo.png
```

Notes:
- Label a file with `--file name=path` — the name is surfaced in the mapping and legend so you can bind it mentally.
- If you pass references but write **no** `<IMAGE_REF_N>` tags, the CLI appends a legend so the model still maps them — but **inline tags give far better control**; prefer them.
- `--task` is auto-selected (`image_to_video` for first-frame, `reference_to_video` for `--file`, `edit` for the edit sub-command, else text); the model also infers. You rarely need to set it.

## Writing the prompt — direct it like a cinematographer

Specificity is control. A vague prompt wastes a ~$1 generation. Build the prompt from these elements (Google's own guidance, transferable from the image models):

- **Subject** — be concrete: "a stoic robot barista with glowing blue optics", not "a robot".
- **Action** — what happens across the clip: "mid-stride, then stops and turns".
- **Framing / composition** — "extreme close-up", "wide establishing shot", "low-angle".
- **Camera & lens** — "shallow depth of field (f/1.8)", "slow dolly-in", "handheld".
- **Lighting / time** — "golden-hour backlight, long shadows", "moody neon".
- **Location** — "a rain-slicked Tokyo alley".
- **Style** — "photorealistic", "film noir", "3D animation", "watercolor".
- **Audio** — "gentle rain and distant thunder", "up-tempo synthwave", or "no dialogue".
- Prefer **"a single continuous shot"** unless you want cuts — it avoids jarring scene breaks.

### Timing / segmented action

To choreograph beats or cuts within the clip, use bracketed timecodes (total ≤ 10s):

```
[0-3s] a seed pushes through soil [3-6s] a stem rises and a bud forms [6-10s] the flower blooms, petals catching light
```

### Text on screen

State the exact words in quotes and how they appear: `the words "SALE" then "TODAY" fade in one at a time, bold sans-serif`.

### Exclusions / negatives

There is **no negative-prompt field** (and no `system_instruction`/`temperature`/`seed`). Phrase exclusions directly in the prompt: "No on-screen text", "No dialogue", "remove the background clutter".

## Editing & iterative refinement

- **`video edit <file> "<change>"`** — modify an existing clip/image. End with **"keep everything else the same"** to constrain the edit. (Editing an *uploaded* video is unavailable in the EEA/Switzerland/UK; editing a clip Omni generated is fine everywhere.)
- **`--previous=<interaction-id>`** — refine the clip you just generated conversationally (the id is printed after each run and in `--json`). This threads a stateful edit rather than starting over.

## Options

| Flag | Default | Description |
|------|---------|-------------|
| `--first-frame <path>` | — | Image to animate FROM (`<FIRST_FRAME>`) |
| `--file <path>` | — | Reference image, repeatable → `<IMAGE_REF_0..N>`; `name=path` to label |
| `--aspect-ratio <r>` | `16:9` | `16:9` or `9:16` — the only two supported |
| `--task <t>` | auto | `text_to_video` / `image_to_video` / `reference_to_video` / `edit` (rarely needed) |
| `--count <n>` | `1` | Candidate clips (video is non-deterministic; curate the best) |
| `--concurrency <n>` | `4` | Max parallel generations in a `--count` batch |
| `--previous <id>` | — | Refine a prior clip via its `interaction_id` |
| `--out <name>` | `video`/`edited` | Base output filename |
| `--json` | — | Envelope: paths, bytes, actual cost, interaction ids, `task`, `references` |
| `--dry-run` | — | Print the cost note (and resolved task/mapping) without generating |
| `--preview` | — | Open the `.mp4` after saving |

For reliable chaining, pass `--json` and read the exact path + `interaction_id` from the envelope.

## Limits & restrictions (don't attempt these)

- **Audio input is unsupported** — you cannot supply an audio file as a reference (but you *describe* audio in the prompt).
- **Video as a generation reference** is not usable (≤3s accepted but "not correctly processed"). Video is only for the `edit` path.
- No cross-video reasoning, no video extension/interpolation, no voice editing, no YouTube URLs as source.
- Uploading/editing videos or images of **minors / recognizable people** is restricted; uploaded-video editing is blocked in the **EEA/Switzerland/UK**.

## API Key & Cross-Cutting Setup

Video needs a Google Gemini API key, which the **CLI manages** — there is no skill-level secret (resolution: `--api-key` > `TINY_GEMINI_API_KEY` > `GEMINI_API_KEY` > `GOOGLE_API_KEY` > `.gemini/.env` > `~/.gemini/.env`). Free key: https://aistudio.google.com/app/apikey. If a command reports no key, surface the CLI's setup instructions rather than storing the key yourself. See the core [tiny-gemini](../tiny-gemini/SKILL.md) skill.

## Constraints

- ALWAYS use `npx tiny-gemini` (not a global install).
- NEVER fabricate flags or `video_config` knobs — there is **no** duration/resolution/fps/seed/negative-prompt parameter. The only real controls are aspect ratio, the reference-image flags/tags, `--task`, and the prompt itself.
- Video is **preview-tier and not free** (~$0.30–$1.00 per clip). **Confirm before batch-generating** (`--count`); use `--dry-run` to remind the user of the per-second rate.
- Always **describe the audio** (or say "no audio") — Omni generates sound whether or not you ask.
- When using reference images, **read the CLI's printed tag→file mapping** and place `<IMAGE_REF_N>` / `<FIRST_FRAME>` tags in the prompt accordingly.
- For higher-fidelity or longer cinematic video with native audio, that's **Veo** (`veo-3.1-generate-preview`) via the core `raw` command — a separate API, not this skill.
