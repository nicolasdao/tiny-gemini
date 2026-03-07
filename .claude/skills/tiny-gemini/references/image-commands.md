# Image Sub-Commands Reference

All image sub-commands use model `gemini-3.1-flash-image-preview` by default, except `describe` which uses `gemini-3-flash-preview`.

## generate (default)

Generate one or more images from a text prompt.

```bash
npx tiny-gemini image "a yellow banana wearing sunglasses"
npx tiny-gemini image generate "a cat" --count=3
npx tiny-gemini image generate "a mountain" --styles=watercolor,sketch,oil-painting
npx tiny-gemini image generate "a forest" --variations=lighting,season
npx tiny-gemini image "a cat" --styles=watercolor,sketch --variations=lighting --count=4
```

| Option | Description |
|--------|-------------|
| `--count=N` | Generate N images of the same prompt. Also limits total output when combined with styles/variations. |
| `--styles=s1,s2,...` | Apply different artistic styles. Common: photorealistic, watercolor, oil-painting, sketch, pixel-art, anime, vintage, modern, abstract, minimalist. |
| `--variations=v1,v2,...` | Apply paired variations (2 images each). Available: lighting, angle, color-palette, composition, mood, season, time-of-day. |
| `--aspect-ratio=R` | Values: 1:1, 1:4, 1:8, 2:3, 3:2, 3:4, 4:1, 4:3, 4:5, 5:4, 8:1, 9:16, 16:9, 21:9 |
| `--image-size=S` | Values: 512px (3.1-flash only), 1K (default), 2K, 4K. Must use uppercase K. |

Styles and variations can be combined (cross-product). `--count` limits total output.

## edit

Edit an existing image with a text prompt.

```bash
npx tiny-gemini image edit photo.png "add sunglasses"
npx tiny-gemini image edit logo.png "change the background to blue"
```

First argument after `edit` is the file path, the rest is the edit prompt. Supports `--aspect-ratio` and `--image-size`.

## describe

Image understanding and analysis. Uses the text model, not the image model.

```bash
npx tiny-gemini image describe photo.png
npx tiny-gemini image describe photo.png "What breed is this dog?"
```

Supports `--stream`. Does NOT support `--aspect-ratio` or `--image-size`.

## story

Generate a multi-step image sequence.

```bash
npx tiny-gemini image story "a seed growing into a tree" --steps=4
npx tiny-gemini image story "building a house" --type=process --steps=6
```

| Option | Values | Default |
|--------|--------|---------|
| `--steps=N` | Any integer | 4 |
| `--type` | story, process, tutorial, timeline | story |
| `--style` | Any string | consistent |
| `--transition` | smooth, dramatic, fade | smooth |

Each step is a separate API call. Supports `--aspect-ratio` and `--image-size`.

## icon

Generate a professional icon with prompt engineering.

```bash
npx tiny-gemini image icon "coffee cup"
npx tiny-gemini image icon "music note" --style=flat --type=favicon
npx tiny-gemini image icon "gear" --background=white --corners=sharp
```

| Option | Values | Default |
|--------|--------|---------|
| `--style` | modern, flat, skeuomorphic, minimal | modern |
| `--type` | app-icon, favicon, ui-element | app-icon |
| `--background` | transparent, white, black, any color | transparent |
| `--corners` | rounded, sharp | rounded |

## pattern

Generate a repeating pattern or texture.

```bash
npx tiny-gemini image pattern "geometric shapes"
npx tiny-gemini image pattern "floral" --type=wallpaper --style=organic --colors=mono
```

| Option | Values | Default |
|--------|--------|---------|
| `--type` | seamless, texture, wallpaper | seamless |
| `--style` | geometric, organic, abstract, floral, tech | abstract |
| `--density` | sparse, medium, dense | medium |
| `--colors` | mono, duotone, colorful | colorful |

## diagram

Generate a technical diagram.

```bash
npx tiny-gemini image diagram "user authentication flow"
npx tiny-gemini image diagram "microservices architecture" --type=architecture --layout=horizontal
```

| Option | Values | Default |
|--------|--------|---------|
| `--type` | flowchart, architecture, network, database, wireframe, mindmap, sequence | flowchart |
| `--style` | professional, clean, hand-drawn, technical | professional |
| `--layout` | horizontal, vertical, hierarchical, circular | hierarchical |
| `--complexity` | simple, detailed, comprehensive | detailed |
| `--colors` | mono, accent, categorical | accent |
| `--annotations` | minimal, detailed | detailed |
