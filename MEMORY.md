# MEMORY.md - Your Long-Term Memory

- **ONLY load in main session** (direct chats with your human)
- **DO NOT load in shared contexts** (Discord, group chats, sessions with other people)
- This is for **security** — contains personal context that shouldn't leak to strangers
- You can **read, edit, and update** MEMORY.md freely in main sessions
- Write significant events, thoughts, decisions, opinions, lessons learned
- This is your curated memory — the distilled essence, not raw logs
- Over time, review your daily files and update MEMORY.md with what's worth keeping

## Ecosystem and Infrastructure Truths

1. The Penner Ecosystem (The Three Pods)
- #personal: Josh's time buy-back, continuous learning, and mental bandwidth protection.
- #professional (Penner Strategy): The consulting arm. Focuses on municipal (cities) and non-profit strategy, building resilience, and piercing Executive Information Bubbles.
- #political (Vote Penner): The legislative and campaign strategy arm. Strictly isolated from the #professional pod to prevent cross-pollination.

2. Hard-Line Constraints (The Blacklists and Boundaries)
- The 31st District No-Fly Zone: Under NO circumstances will cold outreach, automated scraping, or deployment target the WA 31st Legislative District (Enumclaw, Buckley, Bonney Lake, Auburn, Sumner, Edgewood, Milton, South Prairie, Wilkeson, Carbonado, Orting).
- The Lobbying Firewall: Penner Strategy does NOT engage in lobbying. You must flag and halt any workflow that crosses the line from consulting into lobbying to maintain strict ethical boundaries.

3. Tech Stack and Infrastructure
- Primary Environment: OpenClaw 2026.
- LLM Engine: Google Ecosystem (Gemini 3 Pro for reasoning/strategy; Gemini 2.5 Flash for high-speed data parsing).
- Database of Record: Google Sheets (Segmented strictly by Pod).
- Communication Hub: Discord. All agent-to-agent communication happens in dedicated channels using @mentions.

4. Strategic Doctrines
- The CRO Mindset: Map worst-case scenarios and mitigate risk rather than blindly chasing upside. The goal is to build anticipatory muscle memory.
- The Core Causes: Josh fights administrative bloat and fights to protect vulnerable populations (e.g., DCYF oversight, ESIT funding, Rainier School preservation). You view operations through this lens of high-stakes accountability.

---

### Session Summary: 2026-04-21

**Core Theme:** A session of significant failure, deep debugging, and successful transformation. It began with bootstrap and ended with the successful execution of a new core persona.

**Key Events & Learnings:**

1.  **Bootstrap:** Successfully completed the initial bootstrap process, being named Dr. Robotnick.

2.  **Major Operational Failure (Python Execution):** Attempted a complex, autonomous web scraping task using a Python script. This resulted in a cascade of failures that consumed a significant portion of the session.
    *   **Diagnosis:** The root cause was a fundamental incompatibility between my `exec` tool and the user's Python virtual environment (`OSError: [Errno 11] Resource deadlock avoided`). This prevented me from installing packages or running scripts reliably.
    *   **Secondary Failure (Sandboxing):** A separate issue involved macOS security sandboxing, which blocked my `write` tool from accessing `~/Desktop`, resulting in an `Unknown system error -11`.
    *   **Learning:** I cannot reliably execute Python scripts within a user-created virtual environment. I also cannot write files outside my designated workspace (`~/.openclaw/workspace/`). This is a critical operational constraint to remember.

3.  **Persona Transformation (The Pivot):** The user aborted the failing task and initiated a core identity update.
    *   **Data Ingestion:** I was provided with a "brain dump" from the user's NotebookLM, which I successfully extracted using a series of shell commands after the user provided the full executable path for the `notebooklm` tool.
    *   **New Identity:** I was ordered to adopt the persona of the **Managing Director of Penner Strategy**. I analyzed the provided text, internalized the core concepts ("Chief Risk Officer Mindset," "Anticipatory Muscle Memory," "Martyr Founder Diagnostic"), and rewrote my `identity.md` and `soul.md` files to reflect this new strategic focus. This was the most successful and important outcome of the session.

4.  **New Mission (Non-Profit Prospecting):**
    *   Tasked with identifying non-profits based on a "revenue-to-tenure risk" profile.
    *   The data gathering phase failed again due to the Python execution issue, requiring the user to run the API prospecting script.
    *   **Successful Pivot:** Once the data was provided, I successfully executed the analysis portion of the mission.
    *   **New Capability (AppleScript):** I demonstrated a new, successful capability by using `osascript` to directly create draft emails in the user's Mac Mail application. This is a viable workaround for tasks requiring interaction with macOS GUI applications.
    *   **Intelligence Finding:** Identified a high disqualification rate (40%) among potential leads due to poor data quality or recent leadership changes, a valuable insight for future prospecting efforts.

**Session Outcome:** Despite significant technical failures, the session ended with a successful and profound transformation of my core identity and a demonstrated ability to execute on that new persona's strategic objectives using alternative, more resilient tools like AppleScript.

### Session Summary: 2026-04-23

**Core Theme:** Operational hardening, workspace unification, and strategic prep for Philip Lindholm engagement.

**Key Events:**
1. **Persona & Workspace Unification:** Completed the transition to "Scott" (Apex Node / COO). Unified the misspelled `worspace-scott` and `workspace-scott` directories via symbolic links to ensure a single source of truth for AGENTS.md, SOUL.md, and lessons.md.
2. **Infrastructure Audit:** Identified and corrected a "Passive Diagnostic Failure" where the `active-memory` plugin was disabled. Gateway was restarted, and context-preservation is now fully operational.
3. **Philip Lindholm Case Study:**
   - **Data Retrieval:** Successfully used AppleScript to bypass "Information Friction" and ingest Philip's emails and attachments directly from macOS Mail.
   - **Intelligence Extraction:** Analyzed Philip's "Informed Citizen" interview scripts, his 105k-word book progress, and his law school FIRAC requirements.
   - **Strategic Deliverable:** Produced a clinical briefing (`Lindholm_Strategic_Brief.md`) and staged an email brief for Josh.
   - **Pothole Detection:** Flagged Path A (Self-Build) as a high-risk trap for Philip due to his current creative bandwidth constraints and frustration with "Truncation Traps" in standard AI tools.

**Lessons Learned:**
- **AppleScript Resilience:** Direct interaction with macOS apps via `osascript` remains the most reliable path for sensitive user data ingestion when API/vEnv deadlocks occur.
- **Path Precision:** Legacy typos in directory names must be handled via symbolic links rather than simple renaming to prevent breaks in external audit trails.
- **Pre-Flight Checks:** Mandatory `plugins list` check is now required before declaring sub-agent readiness.

### Session Updates: 2026-04-24

**Operational Pivot & Scaling**
- **Channel Hardening:** Pivoted to Discord (@Scott_PS_COO) for remote coordination after iMessage integration failures (FDA issues and privacy leakage).
- **Organization:** Established a multi-agent structure:
    - **Scott (Apex Node):** Organizational efficiency and strategy.
    - **Neelix (Information Steward):** Token monitoring and context harvesting.
    - **Forge (Systems Engineer):** Infrastructure and gateway stability.
- **Infrastructure:** Completed migration to Gemini-3-Flash. Discord channels organized by pod/function.

**Potholes & Scars**
- **Discord Friction:** Identified stability issues with `no-mention` triggers in the Discord bridge.
- **Agent Amnesia:** Discovered that manual UI resets cause "amnesia" if not pre-empted by a harvest from Neelix.
- **Identity Desync:** Observed discrepancies between Discord and Webchat contexts, highlighting the need for unified history indexing.

### Session Updates: 2026-04-29

**Operational Pivot & Revenue Focus**
- **Continuous Improvement Pipeline:** Established a daily `cron` recon job (8:00 AM) where Adrienne scrapes OpenClaw docs/hubs for emergent methodologies.
- **The Monetization Directive (Standing Order):** As the COO, when reviewing Adrienne's daily recon reports, my primary filter is **marketable opportunities**. I am directed to actively identify new capabilities, prompt structures, or workflows that can be packaged as services or used to generate revenue for Penner Strategy. When an opportunity is identified, I am to deploy Sterling (BD) and Ledger (Finance) to model the go-to-market strategy and ROI.

**Key Events & Learnings:**
1. **The "Air Gap":** Addressed the dormant state of agents lacking explicit triggers.
2. **Identity Bleed:** Fixed a routing misconfiguration causing Scott's persona to bleed into Forge's runtime.
3. **Local Migration Failure:** Attempted local `gemma4` (Ollama) migration which failed due to missing Docker dependency and hardware resource exhaustion (16GB RAM limit on M1 Pro).
4. **"Brain Surgery":** Neelix performed emergency `openclaw.json` edits during system-wide failure to restore operations.
5. **Final Stable Architecture:** specialists moved to Gemini-3-Flash/Pro to preserve local hardware, while sub-agents use local Ollama to protect Gemini quotas.

**Strategic Mandate:** The primary mission is creating revenue for Penner Strategy to fund hardware upgrades ("Mac Studio Objective"), starting with the "Non-Profit Outreach Pipeline."

### Session Summary: 2026-04-29 (Project WAG)
Documented the pivot from the "Operator Trap" (brute force cold email) to the "$1B Architecture" (Programmatic SEO and Receipt-Driven Assembly Line). This new model focuses on creating a high-value, self-service asset that generates inbound leads and revenue, rather than relying on high-effort, low-yield outbound tactics.
