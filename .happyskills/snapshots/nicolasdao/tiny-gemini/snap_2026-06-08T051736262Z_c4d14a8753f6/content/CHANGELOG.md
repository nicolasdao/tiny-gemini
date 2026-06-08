# Changelog

All notable changes to this skill will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this skill adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.1] - 2026-06-08

### Changed

- Update `references/raw-api.md` for tiny-gemini CLI v2.0.1: lowercase `response_modalities` enum values (`["image"]`, `["audio"]`) for the Interactions API, GA image model IDs (`gemini-3.1-flash-image`, `gemini-3-pro-image` — the `-preview` IDs shut down 2026-06-25), and array-form `speech_config` with title-case voices.

## [2.0.0] - 2026-05-10

### BREAKING CHANGES

This release decomposes the previously monolithic `tiny-gemini` skill into a **suite** of five focused skills following the HappySkills Suite Pattern. The mega-skill description (474 chars, all four mega-skill detection signals firing) was no longer reliably routing every capability the underlying CLI exposes.

The core `tiny-gemini` skill now owns only **text Q&A, search-grounded answers, and the raw JSON passthrough**. Other capabilities moved to dedicated satellite skills, all auto-installed via `dependencies`:

| Capability moved | New satellite |
|------------------|---------------|
| `image` command (all 7 sub-commands: generate, edit, describe, story, icon, pattern, diagram) and `references/image-commands.md` | `nicolasdao/tiny-gemini-image` |
| `tts` command and multi-speaker TTS guidance | `nicolasdao/tiny-gemini-tts` |
| `research` command and Deep Research agent variants | `nicolasdao/tiny-gemini-research` |
| `models` command, decision rules, sunset calendar, and `references/models.md` | `nicolasdao/tiny-gemini-models` |

**Migration for existing users:** Install the new core (`npx happyskills install nicolasdao/tiny-gemini`) — it auto-installs the four satellites. No CLI behavior changes; only the skill organization changed. The CLI itself is independently versioned and unaffected.

### Changed

- Description rewritten using the five-slot grammar: `tiny-gemini — Ask Gemini for text or send raw API calls via the npx CLI. Use when asking questions, summarizing files, extracting structured data, web-grounded answers, or raw API access. Not for images, audio, deep research, or model lookup.` (~245 chars, well under the 250 soft cap)
- Added `name` field in SKILL.md frontmatter (was missing in 1.x — caused validator cross-file warning)
- skill.json `description` trimmed to under 200 chars per registry conventions
- skill.json `systemDependencies` now covers `win32` for both `node` and `npx`
- skill.json `type: "skill"` field added explicitly (was implicit)
- skill.json `dependencies` map added with all four satellite skills

### Removed

- Image sub-command documentation (moved to `tiny-gemini-image`)
- TTS command documentation (moved to `tiny-gemini-tts`)
- Research command documentation (moved to `tiny-gemini-research`)
- Models command documentation, decision rules, sunset calendar (moved to `tiny-gemini-models`)
- `references/image-commands.md` (moved to `tiny-gemini-image/references/`)
- `references/models.md` (moved to `tiny-gemini-models/references/`)

### Kept in core

- `prompt` command (text generation)
- `search` command (Google Search-grounded text)
- `raw` command (JSON passthrough — escape hatch for any API feature, including embeddings via `--api-base`)
- All cross-cutting setup: API key resolution, env vars (`TINY_GEMINI_API_KEY` / `_API_BASE` / `_MODEL`), agentic workflow flags (`--prompt-file`, `--output-file`, `--output-format`), schema migration awareness (`Api-Revision: 2026-05-20`), sunset model warnings
- `references/raw-api.md` (raw is core, raw reference stays in core)

## [1.2.0] - 2026-05-10

### Added

- New `models` command documentation (offline registry for Gemini models, pricing, deprecations)
- `Environment Variables` section documenting `TINY_GEMINI_API_BASE` and `TINY_GEMINI_MODEL`
- `--json-output` vs `--json` disambiguation table

### Changed

- Default TTS model: `gemini-2.5-flash-preview-tts` → `gemini-3.1-flash-tts-preview`
- Default research agent: `deep-research-pro-preview-12-2025` → `deep-research-preview-04-2026` (corrected — the brief's unversioned `deep-research-preview` ID does not exist on Google's models page)
- Frontmatter description now triggers on model-discovery questions
- `references/raw-api.md` major rewrite for the May 2026 Interactions API schema migration: documents `Api-Revision: 2026-05-20` header, post-2026-05 `steps` response shape, `response_format`-based image config and structured output, new SSE event names, embeddings endpoint guidance

## [1.1.0] - 2026-04-XX

### Added

- Metadata-only release on the registry (no file content changes from 1.0.1)

## [1.0.1] - 2026-03-10

### Added

- Repository URL in skill.json pointing to GitHub source

## [1.0.0] - 2026-03-07

### Added

- Initial release of the tiny-gemini Claude Code agent skill
- Core SKILL.md covering all 6 commands (prompt, image, tts, search, research, raw) and all global options
- Image sub-commands reference (generate, edit, describe, story, icon, pattern, diagram) with all options and values
- Model selection guide with decision rules and comparison tables for all Gemini models
- Raw API reference with function calling, tools, structured output, multi-turn conversations, and multi-speaker TTS
- System dependencies declaration for Node.js >= 18 and npx
