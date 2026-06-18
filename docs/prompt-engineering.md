---
description: Image generation presets (icon, pattern, diagram, story), batch generation with styles and variations, and how the prompt builder functions work.
tags: [prompt-engineering, image, presets, batch-generation]
source:
  - cli.js
---

# Prompt Engineering

This document explains the prompt builder functions used by the `image` sub-commands (icon, pattern, diagram, story) and the batch generation system (styles, variations).

## Overview

The image presets work by taking a user's simple prompt and expanding it with carefully crafted suffixes that guide the image generation model toward specific visual styles. The expanded prompt is then sent to the API as a normal image generation request.

For example:
- User types: `tiny-gemini image icon "coffee cup"`
- Prompt builder produces: `"coffee cup, modern style app-icon, rounded corners, clean design, high quality, professional"`
- This engineered prompt is sent to the API as the `input` field

## Batch Generation

### How buildBatchPrompts Works

The `buildBatchPrompts(prompt, options)` function takes a base prompt and generates multiple prompt variants based on styles, variations, or count. The logic:

1. If `styles` provided → create one prompt per style: `"{base}, {style} style"`
2. If `variations` provided → cross-product with existing prompts (or base): `"{prompt}, {variation suffix}"`
3. If neither but `count > 1` → duplicate the base prompt N times
4. If `count` is set and prompts exceed it → truncate to `count`
5. If nothing specified → return `[prompt]` as-is

Each generated prompt results in a separate API call — the image API returns one image per call, with no multi-image/candidate parameter (see [Gotchas](gotchas.md)). These calls are fanned out **concurrently** (bounded by `--concurrency`, default 4) rather than run one after another, so a batch of N images takes roughly the time of `ceil(N / concurrency)` calls, not N.

### Styles

#### Style List

Styles are free-form strings appended as `"{prompt}, {style} style"`. Common values:

| Style | Effect |
|-------|--------|
| `photorealistic` | Photo-like rendering |
| `watercolor` | Watercolor painting look |
| `oil-painting` | Oil painting texture |
| `sketch` | Pencil/charcoal sketch |
| `pixel-art` | Retro pixel art |
| `anime` | Anime/manga style |
| `vintage` | Aged/retro appearance |
| `modern` | Clean contemporary look |
| `abstract` | Abstract art |
| `minimalist` | Minimal, clean design |

Any string works — the model interprets the style instruction.

#### Style Example

```bash
tiny-gemini image "a mountain landscape" --styles=watercolor,sketch
```

Generates 2 prompts:
1. `"a mountain landscape, watercolor style"`
2. `"a mountain landscape, sketch style"`

### Variations

#### Variation Map

Variations are predefined pairs. Each variation generates 2 images from the base prompt:

| Variation Key | Suffix A | Suffix B |
|---------------|----------|----------|
| `lighting` | `dramatic lighting` | `soft lighting` |
| `angle` | `from above` | `close-up view` |
| `color-palette` | `warm color palette` | `cool color palette` |
| `composition` | `centered composition` | `rule of thirds composition` |
| `mood` | `cheerful mood` | `dramatic mood` |
| `season` | `in spring` | `in winter` |
| `time-of-day` | `at sunrise` | `at sunset` |

#### Variation Example

```bash
tiny-gemini image "a cottage" --variations=lighting,season
```

Generates 4 prompts (2 variations x 2 alternatives each):
1. `"a cottage, dramatic lighting"`
2. `"a cottage, soft lighting"`
3. `"a cottage, in spring"`
4. `"a cottage, in winter"`

### Combining Styles and Variations

When both `--styles` and `--variations` are used, styles are applied first, then variations create a cross-product:

```bash
tiny-gemini image "a cat" --styles=watercolor,sketch --variations=lighting
```

Generates 4 prompts:
1. `"a cat, watercolor style, dramatic lighting"`
2. `"a cat, watercolor style, soft lighting"`
3. `"a cat, sketch style, dramatic lighting"`
4. `"a cat, sketch style, soft lighting"`

### Count Limiting

Use `--count` to cap the total number of images:

```bash
tiny-gemini image "a cat" --styles=watercolor,sketch --variations=lighting --count=2
```

Only generates the first 2 of the 4 possible combinations.

## Icon Preset

### buildIconPrompt Parameters

| Parameter | CLI Option | Values | Default |
|-----------|-----------|--------|---------|
| type | `--type` | `app-icon`, `favicon`, `ui-element` | `app-icon` |
| style | `--style` | `modern`, `flat`, `skeuomorphic`, `minimal` | `modern` |
| background | `--background` | `transparent`, `white`, `black`, any color | `transparent` |
| corners | `--corners` | `rounded`, `sharp` | `rounded` |

### Icon Prompt Template

```
{prompt}, {style} style {type}[, {corners} corners][, {background} background], clean design, high quality, professional
```

- Corners suffix only added for `app-icon` type
- Background suffix only added if not `transparent`

### Icon Examples

| Command | Engineered Prompt |
|---------|------------------|
| `icon "coffee cup"` | `coffee cup, modern style app-icon, rounded corners, clean design, high quality, professional` |
| `icon "star" --style=flat --type=favicon` | `star, flat style favicon, clean design, high quality, professional` |
| `icon "gear" --background=white --corners=sharp` | `gear, modern style app-icon, sharp corners, white background, clean design, high quality, professional` |

## Pattern Preset

### buildPatternPrompt Parameters

| Parameter | CLI Option | Values | Default |
|-----------|-----------|--------|---------|
| type | `--type` | `seamless`, `texture`, `wallpaper` | `seamless` |
| style | `--style` | `geometric`, `organic`, `abstract`, `floral`, `tech` | `abstract` |
| density | `--density` | `sparse`, `medium`, `dense` | `medium` |
| colors | `--colors` | `mono`, `duotone`, `colorful` | `colorful` |

### Pattern Prompt Template

```
{prompt}, {style} style {type} pattern, {density} density, {colors} colors[, tileable, repeating pattern], high quality
```

- Tileable suffix only added for `seamless` type

### Pattern Examples

| Command | Engineered Prompt |
|---------|------------------|
| `pattern "geometric"` | `geometric, abstract style seamless pattern, medium density, colorful colors, tileable, repeating pattern, high quality` |
| `pattern "leaves" --style=organic --type=wallpaper` | `leaves, organic style wallpaper pattern, medium density, colorful colors, high quality` |
| `pattern "circuits" --style=tech --density=dense --colors=mono` | `circuits, tech style seamless pattern, dense density, mono colors, tileable, repeating pattern, high quality` |

## Diagram Preset

### buildDiagramPrompt Parameters

| Parameter | CLI Option | Values | Default |
|-----------|-----------|--------|---------|
| type | `--type` | `flowchart`, `architecture`, `network`, `database`, `wireframe`, `mindmap`, `sequence` | `flowchart` |
| style | `--style` | `professional`, `clean`, `hand-drawn`, `technical` | `professional` |
| layout | `--layout` | `horizontal`, `vertical`, `hierarchical`, `circular` | `hierarchical` |
| complexity | `--complexity` | `simple`, `detailed`, `comprehensive` | `detailed` |
| colors | `--colors` | `mono`, `accent`, `categorical` | `accent` |
| annotations | `--annotations` | `minimal`, `detailed` | `detailed` |

### Diagram Prompt Template

```
{prompt}, {type} diagram, {style} style, {layout} layout, {complexity} level of detail, {colors} color scheme, {annotations} annotations and labels, clean technical illustration, clear visual hierarchy
```

### Diagram Examples

| Command | Engineered Prompt |
|---------|------------------|
| `diagram "login flow"` | `login flow, flowchart diagram, professional style, hierarchical layout, detailed level of detail, accent color scheme, detailed annotations and labels, clean technical illustration, clear visual hierarchy` |
| `diagram "cloud infra" --type=architecture --layout=horizontal` | `cloud infra, architecture diagram, professional style, horizontal layout, detailed level of detail, accent color scheme, detailed annotations and labels, clean technical illustration, clear visual hierarchy` |

## Story Sequence

### buildStoryPrompts Parameters

| Parameter | CLI Option | Values | Default |
|-----------|-----------|--------|---------|
| steps | `--steps` | Any integer | `4` |
| type | `--type` | `story`, `process`, `tutorial`, `timeline` | `story` |
| style | `--style` | Any string | `consistent` |
| transition | `--transition` | `smooth`, `dramatic`, `fade` | `smooth` |

### Story Prompt Template

For each step N of M:

```
{prompt}, step {N} of {M}, {type-specific suffix}[, {transition} transition from previous step]
```

The transition suffix is only added for steps 2+.

### Story Type Suffixes

| Type | Suffix |
|------|--------|
| `story` | `narrative sequence, {style} art style` |
| `process` | `procedural step, instructional illustration` |
| `tutorial` | `tutorial step, educational diagram` |
| `timeline` | `chronological progression, timeline visualization` |

### Story Examples

```bash
tiny-gemini image story "a caterpillar becoming a butterfly" --steps=3
```

Generates 3 prompts:
1. `a caterpillar becoming a butterfly, step 1 of 3, narrative sequence, consistent art style`
2. `a caterpillar becoming a butterfly, step 2 of 3, narrative sequence, consistent art style, smooth transition from previous step`
3. `a caterpillar becoming a butterfly, step 3 of 3, narrative sequence, consistent art style, smooth transition from previous step`

## Adding a New Preset

### Step 1: Create the Prompt Builder

Add a function in the Prompt Builders section of `cli.js`:

```javascript
function buildMyPresetPrompt(prompt, v = {}) {
    const style = v.style || 'default-style';
    let p = `${prompt}, ${style} preset-specific-suffix`;
    p += ', quality keywords, output guidance';
    return p;
}
```

### Step 2: Register as Image Sub-Command

Add to `IMAGE_SUBS` and add a `case` in `handleImage`:

```javascript
case 'mypreset': {
    const prompt = rest.join(' ') || 'default prompt';
    const engineered = buildMyPresetPrompt(prompt, values);
    log('Generating...');
    const body = { model, input: engineered, response_modalities: ['image'] };
    if (hasGenConfig) body.generation_config = genConfig;
    const resp = await callAPI(imgConfig, body);
    const out = extractOutputs(resp);
    for (const img of out.images) {
        await saveOutput(config.outputDir, 'mypreset', img.data, img.mime, config);
    }
    break;
}
```

### Step 3: Add CLI Options

If the preset needs new CLI options, add them to the `parseArgs` options in `main()`:

```javascript
'my-option': { type: 'string' },
```

### Step 4: Update Help Text

Add the new sub-command to `HELP_IMAGE` and optionally to `HELP_MAIN`.
