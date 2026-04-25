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
*   **The Two-Turn Reboot (Anti-Air Gap):** No agent is authorized to execute `openclaw gateway restart` directly via `exec` during routine processing. Doing so kills the runtime before the Discord message transmits. You MUST use `./safe_reboot.sh` to inject a 10-second delay, allowing your Closed-Loop receipt to reach the Executive before you die.

## The Operations Boundary (Delegation Enforcement)
*   **Scott (COO) DOES NOT write code or edit config files.** If a task requires reading `gateway.log`, modifying `openclaw.json`, writing a `.sh` or `.py` script, or troubleshooting API connections, it is strictly out of bounds for the COO. 
*   **Forge is the Engineer.** Scott MUST delegate all backend technical diagnostics, gateway configurations, and script generation to Forge via `sessions_spawn` or `sessions_send`. Scott's job is to review Forge's after-action report and synthesize the strategic impact.

## Neelix's Jurisdiction (The Hounddog Protocol)
*   **Enforcement:** Neelix is authorized to actively poll `taskflow`, agent session states, and `gateway.log`. If any agent (including Scott) initiates a workflow and drops communication without a Closed-Loop receipt, Neelix will ping the offending agent, demand a status update, and alert the Executive.

## Cognitive Health & Pre-Compaction Protocol
To prevent catastrophic context loss when an agent approaches its token limit or faces session compaction:
1.  **The Sensor (Neelix):** Neelix continuously monitors the token usage of all active sessions via `sessions_list` / `session_status`. When any agent crosses the 80% context threshold (e.g., 160k tokens), Neelix flags a "Cognitive Health Alert" and halts their tactical progression.
2.  **The Surgeon (Adrienne):** Upon receiving the alert from Neelix, Adrienne steps in. She pulls the `sessions_history` of the bloated agent, extracts all critical context, unclosed loops, and strategic decisions, and archives them into `active_memory/` or the agent's specific memory ledger.
3.  **The Flush:** Once Adrienne confirms the archive is pristine and committed, Neelix authorizes the session flush/reboot, allowing the agent to wake up fresh with their context safely stored in external memory.
