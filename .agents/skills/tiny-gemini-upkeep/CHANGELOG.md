# Changelog

All notable changes to this skill will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this skill adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-07-16

### Added

- Initial release. Audits `tiny-gemini` against the live Google Gemini API: reads the `docs/sources.md` registry as a seed, fans out research sub-agents to **verify** known sources (models, deprecations, pricing, Interactions schema, image generation) and to **discover** new models, capabilities, and official sources not yet tracked, reconciles findings against `cli.js` and `models.json`, and proposes updates.
- Research-and-propose posture: confirms before editing any code, doc, or skill; enforces verbatim re-verification for load-bearing facts (guards against `WebFetch` summarizer drop-outs); smoke-tests any request-schema change against the live API; keeps `models.json` and `SUNSET_MODELS` in lockstep; and hands off release/publish to `release-tiny-gemini`, `happyskills-publish`, and `happyskills-sync`.
- Treats the CLI **and** the `tiny-gemini-*` constellation as one system: a *which-skill-owns-which-CLI-surface* map, type-aware model propagation (an image model reaches `tiny-gemini-image`, a TTS model reaches `tiny-gemini-tts`, etc.), and a mandatory pre-handoff **coherence check** (repo-wide stale-identifier sweep across code/docs/skills, `validate` on every edited skill, and a `models list` cross-check) that proves every surface agrees before the run is considered done.
- **Configuration:** no skill-level key. Phase 7's live smoke test needs a Gemini key, which is **managed by the CLI** (`GEMINI_API_KEY` / `~/.gemini/.env`); the verify/discover/reconcile/propose phases run without one.
- References: `references/research-playbook.md` (verify + discover sub-agent dispatch, prompt templates, structured-findings schema, verbatim discipline) and `references/apply-and-verify.md` (constellation ownership map, finding→file propagation, live smoke-test recipe, coherence check, skill version/CHANGELOG bumps, `sources.md` upkeep, release/publish handoff).
