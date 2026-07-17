# Apply and Verify

Runs **after** the user approves the Phase 5 proposal. Propagate each approved finding to every surface, smoke-test anything that changes a request, then record and hand off.

## The system is the CLI **plus** the constellation — one coherent product

`tiny-gemini` is not just `cli.js`. It ships a **constellation of skills** that teach agents how to use it, plus the docs. A currency update is only done when the CLI, the docs, **and every affected skill tell the same story**. A new model the CLI accepts but the `tiny-gemini-image` skill never mentions — or a field the CLI dropped but `raw-api.md` still shows — is an *incoherent* system. Treat the CLI and the skills as one unit that must always agree; the whole point of this skill is to keep them merged, not to patch the CLI and leave the skills stale.

### Which skill owns which CLI surface

For any change, this tells you which skill(s) must move with the CLI:

| CLI surface changed | Owning skill(s) | Also update |
|---------------------|-----------------|-------------|
| Model registry, IDs, pricing, deprecations, decision rules | `tiny-gemini-models` (`SKILL.md` + `references/models.md`) | `docs/model-selection.md`, `docs/api-reference.md` |
| Image model or image params (aspect ratio, size, reference images) | `tiny-gemini-image` (`SKILL.md`) | `docs/commands.md`, `docs/prompt-engineering.md` |
| TTS model, voices, `speech_config` | `tiny-gemini-tts` (`SKILL.md`) | `docs/commands.md` |
| Deep-research agents / `background` shape | `tiny-gemini-research` (`SKILL.md`) | `docs/commands.md` |
| Request-body schema, headers, `raw` API, function calling | `tiny-gemini` core (`references/raw-api.md`) **plus** any skill whose examples show that body (`tiny-gemini-image`, `tiny-gemini-tts`) | `docs/api-reference.md`, `docs/commands.md`, `docs/gotchas.md` |
| New global flag or new top-level command | `tiny-gemini` core (`SKILL.md`) + the command's own skill | `docs/commands.md`, `README.md` |

**A model finding is type-aware.** A new/changed **image** model touches `tiny-gemini-models` AND `tiny-gemini-image`; a **TTS** model touches `tiny-gemini-models` AND `tiny-gemini-tts`; a **text** model touches `tiny-gemini-models` (and the core default if it changes). Never update `tiny-gemini-models` alone for a typed model.

**A genuinely new capability may need a new skill.** If a finding introduces a command family or capability no existing skill covers, the coherent fix includes a **new satellite skill** — do not bolt it onto an unrelated one. Route that to `happyskills-design` (Constellation Pattern) so the new member stays orthogonal, and flag it in the proposal.

## Finding → file propagation map

Every surface a finding can touch. Do not stop at the first one — a single change ripples across code, docs, and skills (use the ownership table above to find the skills).

| Finding | Files to update |
|---------|-----------------|
| **New model** | `models.json` (add entry); `docs/model-selection.md` (All-models table + decision rule if it changes a "best/cheapest X"); `docs/api-reference.md` (model tables); `tiny-gemini-models` skill (`SKILL.md` rules + `references/models.md`); **plus the type's skill** — image→`tiny-gemini-image`, TTS→`tiny-gemini-tts` (its model-override guidance), text→core default if it changes |
| **Status change** (preview→GA, etc.) | `models.json` `status`; the same docs/skill tables (incl. the type's skill) |
| **Pricing change** | `models.json` `pricing`; `docs/model-selection.md` cost columns |
| **Deprecation / shutdown** | `models.json` (`deprecated_on`/`shutdown_on`/`replacement`) **and** `SUNSET_MODELS` in `cli.js` — always together; `docs/model-selection.md` + `docs/gotchas.md` if the replacement/date changes; the type's skill if it named the model as a recommendation |
| **Schema change** (request body/header) | `cli.js` (the body builders in `handleImage`/`runImageBatch`/`handleTTS`/`handlePrompt`, or `apiHeaders`/`API_REVISION`); `docs/api-reference.md`; `docs/commands.md` (request-body examples); `docs/gotchas.md`; the `tiny-gemini` core skill `references/raw-api.md`; **`tiny-gemini-image` / `tiny-gemini-tts` wherever their examples show the body** (grep the skills for the changed field — see the coherence check) |
| **New capability** | If `raw` already covers it: document in `docs/api-reference.md` + `tiny-gemini` `references/raw-api.md`. If it warrants a dedicated command/flag: update `cli.js`, the command's skill, `docs/commands.md`, `README.md`. If no existing skill covers the new area: propose a **new satellite skill** via `happyskills-design` |
| **New source** | `docs/sources.md` §1 (primary) or §2 (secondary), with URL + what it drives |

### Keep `models.json` and `SUNSET_MODELS` in lockstep

The CLI refuses/​warns on sunsetting models via `SUNSET_MODELS` in `cli.js`; the registry carries the same lifecycle data in `models.json`. A deprecation finding that updates one but not the other leaves the CLI and its registry disagreeing. Update both in the same pass and re-check with `node cli.js models list --status=deprecated`.

## Class 2 — Migration playbook

When a used API/model is broken, replaced, or deprecating soon, migrate to the recommended replacement **without changing what the CLI can do**.

1. **Confirm the replacement verbatim.** The replacement ID/shape must be pulled from an official page (not a summarizer) — it is going into code.
2. **Map old → new at the implementation layer only** — model ID, header, request-body field/shape, endpoint. Write down the exact before/after.
3. **Apply across every surface** (use the ownership map above) so the *documented plain-English capability is identical afterward*. Example: were `gemini-3.1-flash-image` replaced, you'd swap the ID in `MODELS` (`cli.js`), `models.json`, `docs/model-selection.md` + `api-reference.md`, and `tiny-gemini-image` — but the sentence "generate an image from a prompt" never changes. Move the retired ID into `SUNSET_MODELS` if it is now deprecated.
4. **The agentic-breaking test — run it before you finish.** Read the skill/doc description of the affected capability *before* and *after*. If a user asking for the same thing in plain English still gets the same result, the migration is non-breaking (implementation churn the agent absorbs) → ship it. If the description had to change (the capability now does less, an output the user consumes changed, a flag's meaning shifted), STOP — this is a *true* breaking change → take it back to Phase 5 as a Class 3 decision; do not apply it silently.
5. **Smoke-test the migrated path** live (Phase 7) — a real call proving the new shape works.

## Class 3 — Decision templates (for Phase 5)

Class 3 findings are **surfaced, never auto-applied**. Present each with enough for the principal to decide in one read. Do not fold them into the Class 1/2 changes.

**New capability / modality / command** (e.g. video via Omni Flash):

> **&lt;Name&gt;** — &lt;one-line what-it-is&gt;. *Confidence:* &lt;confirmed-live | could-not-verify&gt; · *Source:* &lt;url&gt;
> - **What it does** — the capability in plain English (inputs → outputs).
> - **How it works** — endpoint / model / tool + request shape at a glance; is it reachable via `raw` today?
> - **Value proposition** — why it might be worth adding; what it unlocks for tiny-gemini users.
> - **Proposed integration shape** — catalog entry only? a new `--flag`/command on an existing skill? a new satellite skill via `happyskills-design`? — with the rough cost of each.
> - **Recommendation** — integrate / document-only / skip, with a one-line reason.

**Removed capability** (something the CLI does that is no longer possible):

> **&lt;Capability&gt;** — no longer supported. *Source:* &lt;url&gt; confirming removal.
> - **What is lost** — the plain-English capability that no longer works.
> - **Blast radius** — the exact command(s) / flag(s) / skill(s) that rely on it.
> - **Options** — remove the command/flag · keep it but document it as unavailable · replace with the nearest alternative — with the trade-off of each.
> - **Recommendation** — one line.

## Skill propagation — version + CHANGELOG

For every `.agents/skills/tiny-gemini*` skill whose content you edited:

1. Bump the patch version in its `skill.json`.
2. Add a dated entry at the top of its `CHANGELOG.md` (Keep-a-Changelog format, matching the existing sections).
3. `.claude/skills/*` are symlinks into `.agents/skills/` — edit the `.agents/` source; both trees update.
4. Validate: `npx happyskills validate <skill-name> --json` (fix any errors before handoff).

## Smoke-test (Phase 7) — required for any request/schema change

Docs are not proof the API accepts a body. Verify with a real key (the CLI resolves `GEMINI_API_KEY` / `~/.gemini/.env` itself). Write outputs to a temp dir so nothing lands in the repo.

```bash
# 1. Confirm the CLI still loads and resolves models
node cli.js --version
node cli.js image "test" --model=<model> --dry-run     # no API call — checks resolution

# 2. Live round-trip (cheap): image + tts under the new shape
node cli.js image "an abstract composition of overlapping teal and coral triangles, flat vector" \
  --image-size=1K --out smoke --output-dir /tmp/tg-smoke --json
node cli.js tts "Schema check. One two three." --output-dir /tmp/tg-smoke
```

Interpreting results:
- A saved image/WAV = the new body shape is **accepted** by the live API. Done.
- `400 ... value not supported` / `unknown field` = a real **schema** error — the change is wrong, revisit.
- `400 ... copyright/recitation` or other content filters = a **content** rejection of the prompt, **not** a schema error. Retry with a different, clearly-original prompt before concluding anything.

Keep the spend minimal (1K image ≈ a few cents). Report the actual cost.

## Coherence check — before handoff (do not skip)

Applying changes file-by-file is not enough; you must **prove the CLI, docs, and every skill now agree**. This is the step that turns a batch of edits into one coherent system.

1. **Repo-wide stale-identifier sweep.** For every identifier you changed — an old model ID, a removed field name (`response_modalities`), a changed enum value, an old default — grep the entire surface and confirm zero *live* hits outside history/frozen files:
   ```bash
   grep -rn "<old-identifier>" cli.js models.json docs/ .agents/skills/ \
     | grep -v "docs/manual/" | grep -v "CHANGELOG"
   ```
   A hit in a `SKILL.md`, a reference file, or a doc means that surface still teaches the old behavior — fix it before handoff. (`.claude/skills/*` are symlinks to `.agents/skills/*`, so grepping `.agents/skills/` covers both.)
2. **Every edited skill validates.** Run `npx happyskills validate <skill> --json` for each skill you touched — no errors.
3. **Examples still run.** Spot-check that a changed skill's documented example actually works against the current CLI (run the `image`/`tts`/`models` command it shows). A skill whose example now 400s is incoherent with the CLI.
4. **Model set agrees.** `node cli.js models list --json` must match what `tiny-gemini-models` (`references/models.md`) and `docs/model-selection.md` describe — same IDs, statuses, replacements. No model exists in one place and not the others.
5. **Doc index stays coherent.** If headings or files changed, regenerate `doc-manifest.json` (via `/update-doc` or the generator) so the doc index matches the corpus.

Only when all five pass is the CLI-plus-constellation actually consistent. If any fails, the update is not done — resolve it before Phase 8.

## Phase 8 — record + hand off

1. **Update `docs/sources.md`:** add any `new-source` findings to §1/§2, append a row to the **Verification log** (date, scope, outcome), and bump the **Last verified** date at the top.
2. **Hand off — this skill never publishes:**
   - CLI: entries are in `CHANGELOG.md` under `[Unreleased]`; tell the user to run `/release-tiny-gemini` to version + tag.
   - Skills: tell the user to run the HappySkills publish/sync flow (`happyskills-publish` / `happyskills-sync`) to republish the bumped skills and regenerate `skills-lock.json`.
   - Docs: regenerate `doc-manifest.json` via the doc producer/`update-doc` if headings or files changed (e.g. a new source section).
3. **Summarize** what changed, what was confirmed already-current, what could not be verified, and the exact follow-up commands the user still needs to run.
