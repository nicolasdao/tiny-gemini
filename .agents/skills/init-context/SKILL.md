---
name: init-context
description: Load project context by reading README and recursively following relevant documentation links based on a question or topic
argument-hint: [question or topic]
---

You are being asked to load context about this project to help answer a specific question or explore a particular topic.

**IMPORTANT:**
**1. During the documentation loading phase (Steps 1-6), you are ONLY gathering information. DO NOT modify any files or make any changes during this phase.**
**2. DO NOT READ ANY FILES LOCATED UNDER THE `specs/` FOLDER OR UNDER THE `docs/manual/` FOLDER**
**3. The following files MUST be read regardless of the topic or question if they exist under the `docs/` folder:**
**   - `gotchas.md` or `GOTCHAS.md` — critical project-specific pitfalls and edge cases (see [Gotchas Loading](#gotchas-loading) for hub+domain handling)**
**   - `mission.md` or `MISSION.md` — project vision, values, and decision-making compass**
**These files contain foundational context that is always relevant.**

## Your Task

The user has provided this question or topic:
```
$ARGUMENTS
```

## Process: Recursive Documentation Discovery

Follow this iterative process to build up context:

### Step 1: Read the README.md

Start by reading the README.md file (if it exists in the current directory). This is your entry point to understand:
1. What this project does
2. Its main features and capabilities
3. Links to other documentation files

### Gotchas Loading

Gotchas are project-specific pitfalls — things that WILL bite you if ignored. They must be loaded early and treated as high-priority warnings, not background documentation.

**Detection**: After reading README.md, determine which gotchas format this project uses:

1. **Check for `docs/gotchas/` directory** using Glob: `docs/gotchas/*.md`
2. **Check for `docs/gotchas.md`** (or `docs/GOTCHAS.md`)

**Format A — Hub + Domain files** (the `docs/gotchas/` directory exists):

1. **Read the hub file** (`docs/gotchas.md`). This is a small index (~30-50 lines) listing all gotcha domains with descriptions and links to `docs/gotchas/<domain>.md` files. Always read it in full.
2. **Select relevant domain files**. From the hub, identify which `docs/gotchas/<domain>.md` files are relevant to the user's question/topic. Use the same relevance criteria as Step 2 (link evaluation). Read only the relevant domain file(s).
3. **Record unloaded domains**. Note which domain files you did NOT load. You will include these in your summary (Step 5) as a progressive discovery reminder.

**Format B — Monolithic file** (no `docs/gotchas/` directory, only `docs/gotchas.md`):

Read `docs/gotchas.md` in full. This is the legacy format — the entire file is loaded regardless of size.

**Attention framing**: When you encounter gotchas content (from either format), treat each gotcha as a warning. These are not reference documentation — they are lessons learned from production incidents. In your summary, present gotchas prominently under their own heading, not buried inside general findings.

### Step 2: Extract and Evaluate Links

From the README.md, identify all links to other documentation files (markdown files, text files, or other documentation). For each link, evaluate whether it's relevant to the user's question/topic.

**Relevance criteria:**
- Does the link description or surrounding context relate to the question/topic?
- Would this documentation help answer the user's question or provide necessary background?

**Track what you've read:**
- Keep a mental list of all files you've already read to avoid infinite loops
- If a link points to a file you've already read, skip it

### Step 3: Read Relevant Linked Documentation

Read each relevant documentation file you identified. As you read each file:
1. Extract key information related to the user's question/topic
2. Look for MORE links to other documentation files within this document
3. Evaluate those new links for relevance (same criteria as Step 2)
4. Add relevant unread files to your reading list

### Step 4: Repeat Recursively

Continue the process:
- Read next relevant documentation file from your list
- Extract information and find new links
- Evaluate new links for relevance
- Read those relevant docs
- Keep going until you've exhausted all relevant documentation paths

**Important safeguards:**
- Never read the same file twice (check your tracking list)
- Stop when no new relevant documentation links are found
- Don't follow links that are clearly not relevant to the question/topic
- Limit to documentation files in the project (don't follow external URLs)

### Step 5: Summarize Your Findings

After completing the recursive documentation discovery, provide:

1. **Gotchas (WARNINGS)**: If any gotchas were loaded, present them FIRST under a dedicated heading. These are not suggestions — they are hard-won lessons. Frame them as: "The following gotchas are directly relevant to this work and must be respected." List each gotcha with its title and a one-line summary of the risk.

2. **List of files read**: Show which documentation files you read and in what order.

3. **Why each was relevant**: Brief explanation of why you chose to read each file.

4. **Key findings**: Summarize the information relevant to the user's question/topic.

5. **Context loaded**: Confirm that you now have sufficient context to help with their question.

6. **Progressive discovery reminder** (hub+domain gotchas format only): If the project uses the `docs/gotchas/` directory structure and some domain files were NOT loaded, include this notice at the end of the summary:

   > **Additional gotcha domains available:** [list the unloaded domain names with one-line descriptions from the hub]. If the conversation shifts to any of these areas, load the relevant `docs/gotchas/<domain>.md` file before proceeding — these contain critical warnings that could prevent mistakes.

   Omit this notice if all domain files were loaded, or if the project uses the monolithic gotchas format (Format B).

### Step 6: Document the Unread Documentation Index

In your summary, include a section called **"Documentation not yet loaded"** that lists every documentation file referenced in the README.md that you did NOT read during this session. For each file, include its path and a brief description of what it covers (based on the README's link text or surrounding context).

This index is critical — it enables the ongoing progressive loading behavior described below.

### Step 7: Decide Whether to Proceed or Wait

After loading context, evaluate the user's original prompt to determine whether to **proceed with implementation** or **stop and wait**.

**Stop and wait** if the prompt signals analysis-only intent:
- The user is asking a question ("How does X work?", "What's the best approach for Y?")
- The user explicitly asks to pause ("analyze the requirements and tell me when you're ready", "load context for X", "review the docs and report back")
- The intent is exploratory or informational, not actionable

In this case: summarize your findings and state that you've loaded the context and are ready for the user's next instruction. Do not make changes or suggestions.

**Proceed with implementation** if the prompt is a clear action request:
- The user wants something done ("add a new endpoint for X", "fix the bug in Y", "refactor Z to use W")
- The intent is unambiguous — there is a concrete task to execute

In this case: summarize your findings briefly, then proceed directly to implementation. Do not stop to ask for permission — the user already told you what to do.

---

## Ongoing Progressive Documentation Loading

**This instruction applies for the entire conversation, not just during the initial context-loading phase.**

After the initial context load, you will continue working with the user on various tasks throughout the conversation. As the conversation progresses and the user's requests shift to new areas, you MUST follow this rule:

**Before starting work on a new task or topic area, pause and ask yourself:**
> "Does the work I'm about to do touch an area of the project for which documentation exists but was not loaded during the initial context phase?"

To answer this, refer back to:
1. The **"Documentation not yet loaded"** list from your initial summary
2. The **progressive discovery reminder** for unloaded gotcha domains (if applicable)

**If the answer is yes — load the relevant documentation BEFORE proceeding with the task.** Read the file(s), absorb the context, and factor it into your work. Do not ask the user for permission to do this — it is expected behavior.

**If you are unsure whether a piece of unloaded documentation is relevant**, err on the side of loading it. The cost of reading an unnecessary file is negligible compared to the cost of missing critical context.

This is not optional. Skipping this step risks:
- Contradicting established patterns documented in the project
- Missing gotchas that could lead to bugs or regressions
- Duplicating work or approaches that were already tried and rejected

---

## Example Process Flow

```
User question: "How does the deployment pipeline work?"

1. Read README.md
   → Find link to docs/architecture.md (relevant ✓)
   → Find link to docs/api.md (not relevant ✗)
   → Find link to docs/deployment.md (relevant ✓)

2. Gotchas Loading
   → Glob docs/gotchas/*.md → found: database.md, deployment.md, frontend.md
   → Hub+domain format detected
   → Read docs/gotchas.md (hub — always read)
   → Read docs/gotchas/deployment.md (relevant to question ✓)
   → Skip: database.md, frontend.md (not relevant to question)
   → Record unloaded domains: database, frontend

3. Read docs/architecture.md
   → Find link to docs/data-model.md (not relevant ✗)

4. Read docs/deployment.md
   → No new relevant links found

5. Done — summarize findings
   → Present deployment gotchas as WARNINGS first
   → List files read and key findings
   → Include progressive discovery reminder:
     "Additional gotcha domains available: database, frontend.
      If work shifts to these areas, load the relevant gotcha file first."
   → Include "Documentation not yet loaded":
     "- docs/api.md — API endpoint reference
      - docs/data-model.md — database schema and relationships"

6. Later in the conversation...
   User: "Now let's update the data model to add a new table"
   → Before starting: check "Documentation not yet loaded" list
   → docs/data-model.md is relevant → read it first
   → Also check gotcha domains: database.md is relevant → read docs/gotchas/database.md
   → Now proceed with the task, informed by both documents
```

Remember: Steps 1-6 are a context-loading phase — no modifications during documentation discovery. After Step 6, the skill either proceeds to implementation or waits, depending on the user's intent (see Step 7). The progressive loading behavior applies for the entire conversation.
