---
name: tiny-gemini-image
description: tiny-gemini — Generate, edit, and analyze images via the Gemini image models in the npx CLI. Use when creating images, editing photos, generating icons, patterns, or diagrams, or describing pictures. Not for text generation, audio, or research.
user-invocable: false
allowed-tools: Bash, Read
---

# tiny-gemini-image — Image generation, editing, and understanding

Use the `npx tiny-gemini image` sub-command for any image-related task with the Google Gemini image models. Part of the [tiny-gemini](../tiny-gemini/SKILL.md) suite.

## Scope

This skill owns every image-related verb in the tiny-gemini CLI:

| User intent | Sub-command |
|-------------|-------------|
| "make / create / generate an image of X" | `image` (or `image generate`) |
| "edit / modify / add to this photo" | `image edit <file> "<prompt>"` |
| "describe / analyze / what's in this image" | `image describe <file>` |
| "tell a visual story", "step-by-step image sequence" | `image story` |
| "design an icon / app icon / favicon" | `image icon` |
| "make a repeating pattern / texture / wallpaper" | `image pattern` |
| "draw a flowchart / architecture / network diagram" | `image diagram` |

### What NOT to handle here

| Sibling intent | Where it lives |
|----------------|----------------|
| Text Q&A, summarization, extraction, search-grounded text | Core `tiny-gemini` skill |
| Speech / audio generation | `tiny-gemini-tts` |
| Multi-minute autonomous research reports | `tiny-gemini-research` |
| Looking up which models exist or what they cost | `tiny-gemini-models` |

## Default Models

| Sub-command | Default model |
|-------------|---------------|
| `generate`, `edit`, `story`, `icon`, `pattern`, `diagram` | `gemini-3.1-flash-image` |
| `describe` | `gemini-3-flash-preview` (uses the text model — image as input) |

Override with `--model=gemini-3-pro-image` for the highest-quality image gen (better text rendering in images), or `--model=gemini-2.5-flash-image` for cheapest 1K output. Run `npx tiny-gemini models list --type=image` to see the current set.

## Quick Reference

```bash
# Generate
npx tiny-gemini image "a yellow banana wearing sunglasses"
npx tiny-gemini image generate "a cat" --count=3
npx tiny-gemini image generate "a mountain" --styles=watercolor,sketch,oil-painting
npx tiny-gemini image generate "a forest" --variations=lighting,season
npx tiny-gemini image "a cat" --styles=watercolor,sketch --variations=lighting --count=4

# Edit
npx tiny-gemini image edit photo.png "add sunglasses"
npx tiny-gemini image edit logo.png "change the background to blue"

# Describe (image understanding — uses text model)
npx tiny-gemini image describe photo.png
npx tiny-gemini image describe photo.png "What breed is this dog?"

# Multi-step sequence
npx tiny-gemini image story "a seed growing into a tree" --steps=4

# Prompt-engineered presets
npx tiny-gemini image icon "coffee cup" --style=modern --type=app-icon
npx tiny-gemini image pattern "geometric" --type=seamless --colors=mono
npx tiny-gemini image diagram "login flow" --type=flowchart --layout=horizontal
```

## Image Config (all sub-commands)

| Flag | Values |
|------|--------|
| `--aspect-ratio` | `1:1`, `1:4`, `1:8`, `2:3`, `3:2`, `3:4`, `4:1`, `4:3`, `4:5`, `5:4`, `8:1`, `9:16`, `16:9`, `21:9` |
| `--image-size` | `512px` (3.1 Flash only), `1K` (default), `2K`, `4K` — uppercase `K` required |

The CLI sends these as part of the new schema's `response_format: { type: "image", aspect_ratio, image_size }` (post-2026-05 Interactions API).

## Sub-Command Options

For the full option matrix per sub-command (icon style/type/background/corners; pattern type/style/density/colors; diagram type/style/layout/complexity/colors/annotations; story steps/type/transition), see [references/image-commands.md](references/image-commands.md).

## Output

Generated images save as `.png` files to `--output-dir` (default: `./tiny-gemini-output/`). Filename pattern: `image_N.png`, `edited.png`, `icon.png`, `pattern.png`, `diagram.png`, `story_step_N.png`. Pass `--preview` to auto-open after saving.

For `describe`, the response is text (printed to stdout). Supports `--stream` and `--json-output`. To save the description to a file, use shell redirection (`> file.txt`) — the image sub-commands don't honor `--output-file`. If you need the agentic-workflow file pipe (`--output-file` / `--output-format` / `--prompt-file`), use core's `prompt` command with `--file image.png` instead.

## API Key & Cross-Cutting Setup

Image commands need a Google Gemini API key. Setup is shared with the rest of the suite — see the core [tiny-gemini](../tiny-gemini/SKILL.md) skill for:

- API key resolution order (`--api-key` > `TINY_GEMINI_API_KEY` > `GEMINI_API_KEY` > `GOOGLE_API_KEY` > `.gemini/.env`)
- Env var overrides (`TINY_GEMINI_API_BASE`, `TINY_GEMINI_MODEL`)
- Agentic workflow flags (`--prompt-file`, `--output-file`, `--output-format`)
- Schema migration awareness (`Api-Revision: 2026-05-20` header)

## Constraints

- ALWAYS use `npx tiny-gemini` (not a global install)
- NEVER fabricate sub-commands or flags not documented above or in [references/image-commands.md](references/image-commands.md)
- Image output token billing is **expensive** ($60-$120 per 1M output tokens for 3.x image models, ~$0.04/image for 2.5 Flash Image). Confirm before batch-generating large counts.
- Use `gemini-3.1-flash-image` (default) unless the user needs Pro-quality text rendering or the cheapest 1K-only option
- Streaming (`--stream`) is supported only for `describe` (image understanding), not for image generation
