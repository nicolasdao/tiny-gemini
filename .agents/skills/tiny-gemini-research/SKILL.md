---
name: tiny-gemini-research
description: tiny-gemini — Run autonomous Deep Research via the Gemini agents in the npx CLI. Use when commissioning a multi-minute report, comprehensive analysis, or background research. Not for quick search-grounded answers, which use the core.
allowed-tools: Bash, Read
---

# tiny-gemini-research — Deep Research agents

Use the `npx tiny-gemini research` command for **multi-minute autonomous investigations** via Google's Deep Research agents. Part of the [tiny-gemini](../tiny-gemini/SKILL.md) suite.

## Scope

This skill owns every Deep-Research verb in the tiny-gemini CLI:

| User intent | Command |
|-------------|---------|
| "research the history of X" | `research "<topic>"` |
| "do a comprehensive deep dive on Y" | `research "<topic>" --model=deep-research-max-preview-04-2026` |
| "give me a multi-minute investigation report" | `research "<topic>"` |

### What NOT to handle here

| Sibling intent | Where it lives |
|----------------|----------------|
| **Quick web-grounded answers** ("search for X", "what's the latest in Y") | Core `tiny-gemini` skill (`search` command) |
| Text Q&A, summarization | Core `tiny-gemini` skill (`prompt` command) |
| Image, audio | `tiny-gemini-image`, `tiny-gemini-tts` |
| Looking up which agents exist | `tiny-gemini-models` |

**Disambiguation rule:** If the user wants something Gemini can answer in seconds, use the core skill's `search` or `prompt`. If the user wants a multi-minute autonomous report (with citations, structured sections, web traversal), use this skill.

## Default Agent

`deep-research-preview-04-2026` (speed-optimized, streamable variant; April 2026 launch).

For the comprehensive variant (longer, slower, more thorough reports), pass `--model=deep-research-max-preview-04-2026`.

The brief's previously-recommended unversioned `deep-research-preview` ID does **not** exist on Google's models page — always use a dated variant.

## Quick Reference

```bash
# Speed-optimized (default)
npx tiny-gemini research "History of Google TPUs focusing on 2025-2026"

# Comprehensive variant — longer report, slower
npx tiny-gemini research "Comprehensive analysis of TPU architecture trends" \
  --model=deep-research-max-preview-04-2026

# Save the report to a file (long reports are common)
npx tiny-gemini research "Quantum error correction breakthroughs since 2024" \
  > /tmp/quantum-report.md
```

## Execution Model

Research is a **background task**, not a synchronous request. The CLI:

1. POSTs the agent invocation with `background: true`. Returns an `id`.
2. Polls `GET /v1beta/interactions/{id}` every 5 seconds.
3. Prints status updates to stderr (`Status: in_progress`, `Status: completed`, ...).
4. On completion, prints the full report to stdout.

Research tasks typically take **5-15 minutes** (more for `-max-`). Plan for that. The CLI blocks until completion, so:

- For interactive use, just wait — stderr shows progress.
- For agent / scripted use, redirect stderr (`2>&1` or to a file) and stream stdout into your processing.
- The interactive `research` command does NOT support `--stream` (the agent itself isn't streamable; use `raw` if you need lower-level streaming control).

## Pricing

Billed via the underlying model the agent uses (Pro-tier rates). Run `npx tiny-gemini models list --type=agent --json` for the current set of agents and their notes.

## API Key

Research calls the Gemini API and needs a Google Gemini API key, which the **CLI manages** — there is no skill-level secret. Deep Research is **paid tier** (not free), so the key must be on a billing-enabled project. Resolution: `--api-key` > `TINY_GEMINI_API_KEY` > `GEMINI_API_KEY` > `GOOGLE_API_KEY` > `.gemini/.env` (searching up) > `~/.gemini/.env`. Set `GEMINI_API_KEY` in your shell or `~/.gemini/.env` (free key: https://aistudio.google.com/app/apikey). If a command reports no key, surface the CLI's setup instructions to the user rather than storing the key yourself. See the core [tiny-gemini](../tiny-gemini/SKILL.md) skill.

## Constraints

- ALWAYS use `npx tiny-gemini` (not a global install)
- NEVER fabricate agent IDs — always use a dated variant from `npx tiny-gemini models list --type=agent`
- Research is **paid only** and takes minutes — confirm scope with the user before starting (especially the `-max-` variant)
- The CLI polls every 5s — don't wrap it in a tighter loop, that wastes API quota
- If the user wants a quick answer with web context, redirect to core's `search` command instead
