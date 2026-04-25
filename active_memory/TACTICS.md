# TACTICS.md - Standard Operating Procedures

*This file is maintained by the Chief Archivist (Adrienne). It contains the current approved tactical workflows, scripting guidelines, and tool usage patterns.*

## Current Tactics
*   **Script Execution:** Prefer specialized subagents for running Python/Shell scripts to protect the context window of strategic agents.
*   **Rate Limits:** Batch operations and return summaries/zips rather than making sequential looped API calls.

## Agent Onboarding Protocol
*   **No Casual Chat:** Never onboard a new agent with casual conversation. It encourages hallucination and generic AI filler.
*   **Anchor to Bedrock:** The first command given to any new agent must be to read `core/CONSTITUTION.md` and their specific `SOUL.md` file using their local tools.
*   **Establish Hierarchy:** Explicitly define the chain of command (Executive -> COO -> Specialist).
*   **Kill Filler:** Demand the immediate cessation of emojis, pleasantries, and corporate buzzwords.
*   **Verify with Action:** Assign a concrete file-system task (e.g., reading a file and synthesizing a lesson) to verify they are using their tools and adhering to their SOUL directives before they are cleared for operational deployment.
