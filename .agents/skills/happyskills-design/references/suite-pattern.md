# The Suite Pattern — Operational Reference

This document is the operational guide for applying the **Suite Pattern** when designing or refactoring HappySkills skills. It is loaded on demand by `happyskills-design` when a user is decomposing a mega-skill, planning a multi-skill product, or auditing a skill suspected of being a mega-skill.

For the canonical, citation-grade explanation of the pattern (with the full reasoning, failure-mode analysis, and academic references), read `docs/cli-skill.md` in the HappySkills repo. This file focuses on **what to do**, not **why it works** — if you need the underlying reasoning, follow the link.

---

## 1. What the Suite Pattern Is

The **Suite Pattern** is the canonical way to overcome the **mega-skill problem** in AI agent skill ecosystems. Instead of letting one skill grow until its 1024-character description can no longer reliably trigger every capability it owns, you decompose the skill into a coordinated **suite**:

- **One core skill** — a slim entry point owning the highest-frequency lifecycle verbs.
- **Satellite skills** — one per focused verb cluster (e.g., publishing, syncing, designing, collaborating).
- **Dependency-as-bundle** — the core declares the satellites as hard dependencies in its `skill.json`, so installing the core installs the suite.

Result: each member's description fits inside its own 250-character soft cap, routing precision per skill stays high, and the user still gets the "one product, one install" experience.

> **Naming.** "Suite" is the formal noun for the architectural pattern; "family" is the informal everyday noun for the resulting group of skills (analogous to "Office Suite" being made of a family of apps). HappySkills itself ships as a 6-member suite — see `docs/cli-skill.md` for the reference implementation.

## 2. The Load-Bearing Rule — Orthogonal Verb Ownership

**Rule:** in a skill suite, every `<verb, object>` pair has exactly one owner. No two members of the suite may both plausibly claim the same user intent.

This is the **load-bearing constraint** that makes the Suite Pattern work. A suite that decomposes a mega-skill but lets two members claim the same `<verb, object>` pair is not a suite — it is a set of overlapping skills that will route worse than the mega-skill it replaced.

### 2.1 Failure mode — what happens without orthogonality

The LLM's auto-invocation is a selector over skill descriptions. When the user types a prompt, the model scores each available skill's description against the prompt and picks the best match. This selection is approximately a softmax over similarity scores — it is **not** a deterministic rule engine.

When two skills in the same suite claim overlapping verbs and objects:

1. **Routing nondeterminism.** The same prompt routes to skill A on one run and skill B on the next. Users perceive this as "the skill is broken."
2. **Split probability mass.** Even when one skill wins, its win margin shrinks. A close runner-up means an unrelated third skill (or no skill) can occasionally take the slot. Routing accuracy degrades across the whole suite, not just the conflicted pair.
3. **Wrong-skill execution.** When the loser fires instead of the winner, the user gets a skill that does not know how to handle their request.
4. **No-skill fallback.** When the LLM cannot break the tie confidently, it sometimes fires neither skill and answers from general knowledge — invisible to the user, who assumes the skill ran.
5. **Compounding regression with suite growth.** Each new sibling adds N new potential overlaps. A suite that tolerates one overlap at 4 members may collapse at 8.

### 2.2 How to achieve orthogonality

Three layers of enforcement, applied in order:

1. **Description anti-collision** (primary). Each member's `<Verb, Object>` pair is unique across the suite. Where verbs must be shared, objects diverge. The `Not for` slot names the closest sibling's territory and redirects.
2. **Routing disambiguation in SKILL.md.** Every member's Section 1 routing table includes a "what NOT to handle here" subsection listing which sibling owns which verb and the trigger phrase to redirect with.
3. **No umbrella + atomic siblings.** A skill claiming the same verb at a broader scope than its sibling creates an unresolvable tie. The suite must avoid this: either the umbrella absorbs the sibling, or the umbrella narrows its claim.

### 2.3 Worked example — the verb `update`

`update` is the most overloaded verb in the HappySkills suite. Two members own it, separated by **object**:

| Skill | Owns `update` for | Object that disambiguates | Trigger phrase |
|---|---|---|---|
| `happyskills` (core) | Installed-skill lifecycle | `installed skills` | "update my installed skills", "refresh skills" |
| `happyskills-design` | Skill-content authoring | `skill content` | "update this skill based on session learnings" |

Each skill's `Not for` clause points at the other to redirect ambiguous prompts. Verb is the same; object makes the routing orthogonal.

## 3. The Five-Slot Description Grammar

Every member of a skill suite uses the same structural description grammar:

```
<Domain> — <Verb(s)> <Object>. Use when <Triggers>. Not for <Negative>.
```

| Slot | Role | What goes here |
|---|---|---|
| **Domain** | Namespace prefix — hard filter at the front of the description. | The product or suite name (`HappySkills`). One token. Followed by an em-dash. |
| **Verb(s)** | Primary routing signal. | One primary verb, optionally paired with closely related verbs. Imperative mood. |
| **Object** | The other half of the routing signal — same verb, different object often means a different skill. | What the verb operates on, with specificity. Vague objects (`things`, `data`) cause routing collisions. |
| **Triggers** | Concrete user-intent phrases the LLM should recognize as belonging here. | 3–5 short phrases naming concrete user intents. Use the user's vocabulary. |
| **Negative** | Explicit redirection away from sibling skills. | One short clause naming the verbs/intents that belong to a sibling. Effectively required in a suite. |

### 3.1 Composition recipe

Author descriptions in slot order — each slot constrains the next:

1. **Domain.** Write the suite/product name. Mechanical.
2. **Verb(s).** Pick the *one* primary verb that names the dominant action. If you need three verbs, you probably have two skills.
3. **Object.** Name what the verb acts on, with specificity. If two siblings share a verb, the object is what makes routing orthogonal.
4. **Triggers.** List concrete user phrases that should fire this skill. Test each: would a sibling's description plausibly also match? If yes, tighten the trigger or add a Negative.
5. **Negative.** Name the closest sibling's territory and redirect. Skip only if the skill has no near-neighbors in the suite (rare).

### 3.2 Annotated example — the HappySkills core (234 chars)

```yaml
description: HappySkills — Install and update AI agent skills. Use when adding a skill to a project, listing installed skills, refreshing or removing them, signing in, or configuring HappySkills. Not for searching the registry or asking questions.
```

| Slot | Value |
|---|---|
| Domain | `HappySkills` |
| Verb(s) | `Install and update` |
| Object | `AI agent skills` |
| Triggers | `adding a skill to a project, listing installed skills, refreshing or removing them, signing in, or configuring HappySkills` |
| Negative | `searching the registry or asking questions` |

### 3.3 Bad vs good

| | Description | Why |
|---|---|---|
| ❌ Bad | `HappySkills — Manage skills and workspaces. Use when working with HappySkills.` | Vague verb (`manage`), vague object (`skills and workspaces`), tautological trigger, no Negative. Will fire on prompts owned by every sibling. |
| ✅ Good | `HappySkills — Install and update AI agent skills. Use when adding a skill to a project, listing installed skills, refreshing or removing them, signing in, or configuring HappySkills. Not for searching the registry or asking questions.` | Specific verbs, concrete object, user-vocabulary triggers, Negative redirects to the concierge. |

## 4. When to Apply the Suite Pattern

| Situation | Apply Suite Pattern? |
|---|---|
| Single-purpose skill, < 250-char description, no near-neighbors | No. A single focused skill is fine. The five-slot grammar still applies. |
| Description over the 250-char soft cap | Yes. This is the canonical decomposition signal. |
| Description names ≥ 4 distinct primary verbs | Yes. Each verb cluster wants its own home. |
| Triggers span unrelated user-intent domains (e.g., publish + invite + design) | Yes. These are different products inside one skill. |
| User reports the skill failing to fire on supported capabilities | Likely yes. Description has lost semantic clarity to keyword stuffing. |
| User wants to add a major new capability and the description is already at cap | Yes. Adding more keywords will not work — extract a satellite. |
| Two existing skills share a namespace and have overlapping verbs | Yes for the orthogonality check. May or may not require restructuring depending on overlap severity. |

If any of these apply, run the **Suite Decomposition Workflow** from `references/workflows.md`.

## 5. Orthogonality Test — Before You Publish

For each pair of members in your proposed suite, run this check:

1. **List `<verb, object>` pairs.** From each description, extract the Verb and Object slots, plus every concrete intent in the `Use when` triggers.
2. **Cross-compare.** For each pair across two members, ask: would a user prompt for one plausibly match the other's description? If yes, you have an overlap.
3. **Resolve.** Pick one of:
   - (a) **Narrow the object.** `Update skills` → `Update installed skills` vs `Update skill content`.
   - (b) **Add `Not for` clauses to both members** naming each other.
   - (c) **Merge** the two members if the split was artificial.
4. **Sanity-check with prompts.** Write 5 prompts the user might say and trace which member should fire. If you cannot predict deterministically, the LLM cannot either.

A future enhancement of the validator (`cli/src/validation/skill_md_rules.js`) may automate cross-member overlap detection across all members declared in a `dependencies` map. Until then, this check is a manual review step that the agent must run during the Suite Decomposition Workflow and during Audit when siblings exist.

## 6. Anti-Patterns to Reject

| Anti-pattern | Why it fails | Fix |
|---|---|---|
| One member's description names a verb that another member's description also names, with the same object | Routing collision per §2.1 | Apply §2.2 — narrow object, add Negatives, or merge |
| Umbrella member claims the same verb as one of its satellites at a broader scope | Unresolvable tie | Either absorb the satellite or narrow the umbrella |
| Two members differ only by synonym or tense (`Publish` vs `Ship`) | Synonyms are not orthogonal — LLMs match across them natively | Merge, or split by genuinely different objects |
| Suite with no Negative clauses | Every member is at risk of firing on a sibling's prompt | Add Negative slot to every member that has at least one near-neighbor |
| New satellite added without orthogonality test | Silent regression — the suite may have routed fine until the addition | Run §5 before publishing the new member |
| Member description > 250 chars even after decomposition | The "satellite" is itself a mega-skill | Decompose further |

## 7. Hand-off

- For the full procedural workflow that uses this reference (the 8-step Suite Decomposition Workflow), see `references/workflows.md`.
- For description format mechanics (validator-forbidden characters, em-dash vs colon, length budgets, anti-patterns at the single-skill level), see `references/skill-authoring.md`.
- For HappySkills-specific conventions (skill.json shape, dependencies, naming, keywords), see `references/happyskills-conventions.md`.
- For the canonical/citation-grade explanation of why the Suite Pattern works (academic references, the full failure-mode analysis, the reference implementation), see `docs/cli-skill.md` in the HappySkills repo.
