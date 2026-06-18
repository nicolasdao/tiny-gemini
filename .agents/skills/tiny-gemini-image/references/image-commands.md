# Image Sub-Commands Reference

All image sub-commands use model `gemini-3.1-flash-image` by default, except `describe` which uses `gemini-3-flash-preview`.

## Batch & output options (all generation sub-commands)

These apply to `generate`, `edit`, `story`, `icon`, `pattern`, and `diagram` (everything that produces images):

| Option | Description |
|--------|-------------|
| `--count=N` | Generate N candidates of the same prompt. AI image generation is non-deterministic, so generating several and curating the best is the productive path. |
| `--concurrency=N` | Max parallel API calls in a batch (default 4). The image API returns **one image per call** — there is no `candidate_count`/`sample_count` parameter — so a batch of N is N independent requests, fanned out concurrently rather than serially. A single failed call doesn't abort the batch; it's reported on stderr (or in the `failures` array of `--json`). |
| `--out=NAME` | Base output filename; an index (`_1`, `_2`, …) is appended for batches. |
| `--json` | Print a structured result envelope to stdout instead of relying on saved-path logs: `{ model, image_size, count, cost_usd, cost_estimated, images: [{ index, path, format, width, height, bytes, prompt, cost_usd }], references? }`. Real pixel dimensions are parsed from the returned bytes; cost is an estimate from the offline registry. Prefer this for chaining. |
| `--dry-run` | Print the estimated cost (and the resolved prompts) and exit WITHOUT calling the API. Use to confirm spend before large or high-resolution batches. |

`--json` and `--dry-run` compose (a dry-run prints a JSON estimate). Costs are estimates, flagged `cost_estimated: true`, not billed actuals.

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
| `--file=path` | Reference image (repeatable, up to 14). Bound to Image A, B, C… in `--file` order. Prefix with a label to name it: `--file pose=person.png`. See "Reference images" below. |
| `--count=N` | Generate N images of the same prompt. Also limits total output when combined with styles/variations. |
| `--styles=s1,s2,...` | Apply different artistic styles. Common: photorealistic, watercolor, oil-painting, sketch, pixel-art, anime, vintage, modern, abstract, minimalist. |
| `--variations=v1,v2,...` | Apply paired variations (2 images each). Available: lighting, angle, color-palette, composition, mood, season, time-of-day. |
| `--aspect-ratio=R` | Values: 1:1, 1:4, 1:8, 2:3, 3:2, 3:4, 4:1, 4:3, 4:5, 5:4, 8:1, 9:16, 16:9, 21:9 |
| `--image-size=S` | Values: 512px (3.1-flash only), 1K (default), 2K, 4K. Must use uppercase K. |

Styles and variations can be combined (cross-product). `--count` limits total output.

### Reference images (compose / blend / style transfer)

Pass one or more `--file` images and refer to them in the prompt as **Image A, Image B, Image C…** — bound by `--file` order. This is Google's published pattern for multi-image prompting (one text prompt first, image parts after, each image given an explicit role in the text).

```bash
# Letter labels by order: Image A = pose.png, Image B = style.png
npx tiny-gemini image generate "Use Image A for the pose, Image B for the art style" \
  --file pose.png --file style.png

# Named references — the name is added to the prompt; you can reference it directly
npx tiny-gemini image generate "Put the logo onto the bag" \
  --file logo=brand.png --file bag=tote.png
```

- Up to **14** reference images (model-dependent: 3.1-flash = 10 objects + 4 characters; 3-pro = 6 objects + 5 characters + 3 style references).
- The CLI prints the `Image A = <file>` mapping to stderr. When any file is labeled (`name=path`), a legend line is appended to the prompt (`Reference images: Image A = logo, Image B = bag.`).
- Each `--file` must be an image. `--count`/`--styles`/`--variations` **compose** with references — each variation is an independent call sharing the same reference images (e.g. `--count=3 --file ref.png` → 3 candidates from `ref.png`). The reference mapping is also returned in the `--json` envelope as `references`.
- To **edit** a single existing image instead of composing a new one, use `image edit <file> "prompt"`.

## edit

Edit an existing image with a text prompt.

```bash
npx tiny-gemini image edit photo.png "add sunglasses"
npx tiny-gemini image edit logo.png "change the background to blue"
```

First argument after `edit` is the file path, the rest is the edit prompt. Supports `--aspect-ratio`, `--image-size`, and the batch/output options above (e.g. `--count=2` for two edit variants).

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

Each step is a separate API call (steps fan out concurrently, bounded by `--concurrency`). Supports `--aspect-ratio` and `--image-size`.

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
