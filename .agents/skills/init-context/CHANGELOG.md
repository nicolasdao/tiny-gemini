# Changelog

## [1.2.0] - 2026-04-23

### Added
- "Documentation not yet loaded" index in summary (Step 6) — lists all unread docs from README with paths and descriptions
- Ongoing Progressive Documentation Loading section — persistent instruction for the LLM to proactively load relevant unread documentation when the conversation shifts to new topic areas
- Updated example process flow showing ongoing progressive loading in action

### Changed
- Step 7 now conditionally proceeds or waits based on user intent: action requests proceed to implementation, analysis/question requests stop and wait
- Removed `allowed-tools` restriction from frontmatter to allow implementation after context loading
- "No modifications" guardrail scoped to Steps 1-6 (documentation discovery phase) instead of the entire skill execution

## [1.1.0] - 2026-04-08

### Added
- Smart gotchas loading with hub+domain architecture support (`docs/gotchas/` directory)
- Format detection: uses Glob to determine hub+domain vs monolithic gotchas format
- Selective domain file loading: only reads `docs/gotchas/<domain>.md` files relevant to the user's question
- Progressive discovery reminder: summary includes unloaded gotcha domains so the LLM knows to load them if the conversation shifts topics
- Prominent gotchas presentation: gotchas are presented as WARNINGS at the top of the summary, not buried in general findings
- Backward compatibility with monolithic `docs/gotchas.md` (legacy format loaded in full)
- Updated example process flow showing hub+domain gotchas loading

## [1.0.2] - 2026-04-02

### Added
- Always load docs/mission.md (or MISSION.md) alongside gotchas.md for foundational project context

## [1.0.0] - 2026-03-05

### Added
- Initial release
- Recursive documentation discovery from README.md
- Relevance-based link filtering for targeted context loading
- Safeguards against infinite loops and duplicate file reads
