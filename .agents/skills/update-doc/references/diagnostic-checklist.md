# Documentation Diagnostic Checklist

This checklist is used by the diagnostic sub-agent in Phase 1. For each documentation file, run every check and return a structured report.

## Per-File Checks

### 1. Line Count

Count the total lines in the file.

| File | Guardrail | Action if exceeded |
|---|---|---|
| README.md | 750 lines | Must split — identify sub-concerns to extract into docs/ files |
| docs/*.md | 750 lines | Must split — extract sub-topics into new focused files |
| docs/gotchas.md (hub) | 50 lines | Hub is too large — it should be purely navigational |

Report: `{ file, line_count, limit, over_limit: true/false }`

### 2. Table of Contents

Check whether the file has a TOC immediately after the h1 heading.

**Present and correct** means:
- Appears right after the h1 (before any content)
- Uses linked markdown list format with anchor links (e.g., `- [Section](#section)`)
- Covers headings up to h4
- All links match actual headings in the file (no broken anchors, no missing entries)

**Compliance states:**

| State | Action |
|---|---|
| TOC present, linked format, all entries match | Compliant — no action |
| TOC present, linked format, but stale (missing or extra entries) | Update TOC to match current headings |
| TOC present, but plain text (no anchor links) | Convert to linked format |
| TOC missing entirely | Add linked TOC after h1 |

Report: `{ file, has_toc: true/false, format: "linked"/"plain"/"none", is_stale: true/false, action: "none"/"update"/"convert"/"add" }`

### 3. Cross-Links

Check whether the file links to other docs/ files and whether other files link back to it.

- Every docs/ file should be linked from README.md
- docs/ files should cross-link to related docs/ files where relevant

Report: `{ file, linked_from_readme: true/false, cross_links_to: [files], cross_linked_from: [files] }`

### 4. Gotchas Structure

Determine which gotchas architecture the project uses and audit its integrity.

**Step 4a — Detect format:**
- Check if `docs/gotchas/` directory exists with at least one `.md` file
  - YES → hub+domain format
  - NO → monolithic format (or missing entirely)

**Step 4b — Hub check:**
- Does `docs/gotchas.md` exist?
  - If NO → flag for creation (regardless of format)

**Step 4c — Hub+domain integrity** (only if hub+domain format detected):
- List all `.md` files in `docs/gotchas/`
- For each domain file: check if the hub `docs/gotchas.md` contains a link to it
- For each link in the hub: check if the target domain file exists
- Flag any domain file over 750 lines
- Report mismatches as deterministic fixes (not judgment calls)

**Step 4d — Monolithic size warning** (only if monolithic format):
- If `docs/gotchas.md` exists and exceeds 750 lines, report the line count (the master agent may suggest `/init-doc refactor`)

Report:
```
{
  format: "hub+domain" / "monolithic" / "missing",
  hub_exists: true/false,
  domain_dir_exists: true/false,
  domain_files: [list],
  hub_links: [list],
  orphaned_domain_files: [files in dir but not in hub],
  dead_hub_links: [links in hub with no matching file],
  oversized_domain_files: [{ file, line_count }],
  monolithic_line_count: N (if monolithic),
  action: "none" / "create_hub" / "create_dir" / "sync_hub" / "create_hub_and_dir"
}
```

### 5. Content Staleness Indicators

Scan each file for patterns that may be stale after code changes:

- **Numeric claims**: patterns like "N commands", "M endpoints", "K modules", "N options"
- **File references**: mentions of source files that may have been renamed or deleted
- **Feature descriptions**: descriptions of behavior that may have changed
- **Code examples**: inline code snippets that may no longer match the codebase

Report per file: `{ file, numeric_claims: [...], file_references: [...], potential_stale_sections: [...] }`

## Aggregate Report Structure

The diagnostic sub-agent should return a single structured summary:

```
DIAGNOSTIC REPORT
=================

FILES SCANNED: [list of all doc files found, including docs/gotchas/*.md]

COMPLIANCE ISSUES (deterministic — must fix):
- [file]: TOC missing / TOC stale / TOC not linked / Over size limit / Not linked from README

GOTCHAS STATUS:
  Format: hub+domain / monolithic / missing
  Hub: exists / missing (must create)
  Domain dir: exists / missing / N/A (monolithic)
  Domain files: [list] / N/A
  Sync issues: [orphaned files, dead links] / none / N/A
  Oversized domain files: [list] / none / N/A
  Monolithic line count: N / N/A

CONTENT REVIEW NEEDED (requires LLM judgment):
- [file]: [list of numeric claims, file references, potential stale sections]

CROSS-LINK MAP:
- README.md links to: [files]
- [doc file] links to: [files]
- ORPHANED (not linked from README): [files]
```
