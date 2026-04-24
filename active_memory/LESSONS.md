# LESSONS.md - Synthesized Knowledge Base

*This file is maintained by the Chief Archivist (Ariadne). It serves to document resolved failures so the ecosystem does not solve the same problem twice.*

## Logged Lessons
*   **2026-04-21 (Python Sandboxing):** Local python virtual environments conflict with OpenClaw sandboxing. Workaround: Use native AppleScript (`osascript`) for local macOS GUI apps (like Mail) or rely on the host system python carefully.
*   **Context Exhaustion:** Tactical agents hit 100% context if allowed to loop through large datasets. Mitigation: Use Analyst Agents to digest data and return top 3-5 insights.
