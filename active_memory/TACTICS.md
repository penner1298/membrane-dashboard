# TACTICS.md - Standard Operating Procedures

*This file is maintained by the Chief Archivist (Ariadne). It contains the current approved tactical workflows, scripting guidelines, and tool usage patterns.*

## Current Tactics
*   **Script Execution:** Prefer specialized subagents for running Python/Shell scripts to protect the context window of strategic agents.
*   **Rate Limits:** Batch operations and return summaries/zips rather than making sequential looped API calls.
