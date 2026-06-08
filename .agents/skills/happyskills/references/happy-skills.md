# Section 8 — Happy Skills

Per `happyskills@0.51.0+`, there are three distinct buckets in `npx happyskills list --json`, and the "happy" metaphor maps onto them:

- **Happy skill** = managed (in `data.skills`, published to the registry).
- **Draft** = scaffolded by `init`, not yet published (in `data.drafts[]`). One short step from happy.
- **External skill** = hand-rolled, foreign shape (in `data.external[]`). Needs `convert` before it can be published.

Drafts are not "external" and should never be called external in user-facing text. They were created with the official scaffolder and just haven't been shipped yet.

### Status Check ("are my skills happy?", "why are my skills not happy?")

1. Run `npx happyskills list --json`
2. Count entries in `data.skills` (happy), `data.drafts` (drafts — ready to publish), and `data.external` (foreign — need convert + publish).
3. **All happy** (no drafts, no externals) → cheerful confirmation: "All N of your skills are happy!"
4. **Drafts present, no externals** → "N skills are happy, and M draft(s) are ready to go — they just need to be published." Then list the drafts and suggest "say 'publish <name>'" for each.
5. **Externals present, no drafts** → "N skills are happy, but M are feeling left out — they haven't joined the HappySkills family yet." Then list the externals and suggest "say 'convert <name>'" for each.
6. **Both drafts and externals present** → name the two groups distinctly: "N happy, M drafts ready to publish, K external skills that need a quick convert step first." Then list each group separately under its own subheading.

### "Make my skills happy" Workflow

1. Run `npx happyskills list --json` and bucket the unmanaged skills (`data.drafts[]` + `data.external[]`).
2. **Both empty** → "All your skills are already happy! Nothing to do."
3. **Drafts present** → present the drafts list and use AskUserQuestion to ask which to publish. Offer "All drafts" as the first option, plus individual skill names. For each selected draft, route to `happyskills-publish` ("say 'publish <name>'") — the publish skill ships drafts via `release` in one step. Do not run `convert` on any draft. Do not narrate "external" or "convert" for any draft.
4. **Externals present** → present the externals list and use AskUserQuestion to ask which to convert. Offer "All of them" as the first option, plus individual skill names. For each selected external, route to `happyskills-publish` ("say 'convert <name>'") — the publish skill runs `convert` + Post-Convert Enrichment + publish.
5. After everything completes, present a cheerful summary: "N skills are now happy! Welcome to the family, skill-a, skill-b, and skill-c."

### Tone Guidelines

- One playful line per response, max. Dry wit over slapstick. Warm over sarcastic.
- Never block useful information behind humor — always show the skill list and status clearly.
- Never label a draft as "external" or suggest it needs to be "converted." The metaphor is "happy / waiting in the wings / foreign visitor" — drafts are in the wings, not foreign.
