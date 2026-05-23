import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

// Dynamically resolve workspace dir to prevent absolute machine path lock
const WORKSPACE_DIR = process.env.MEMBRANE_WORKSPACE_DIR || process.cwd();
const DAILY_JOURNAL_DIR = path.join(WORKSPACE_DIR, "daily-journal");
const INBOX_DIR = path.join(WORKSPACE_DIR, "INBOX");
const SCRIPTS_DIR = path.join(WORKSPACE_DIR, "scripts");

const DRAFT_JSON_PATH = path.join(DAILY_JOURNAL_DIR, "draft_journal.json");
const TRIAGE_TASKS_PATH = path.join(INBOX_DIR, "triage_tasks.json");
const SUPERVISOR_SCRIPT = path.join(SCRIPTS_DIR, "chronicle_supervisor.py");

export async function GET() {
  try {
    let draftData = null;
    let triageTasks = [];

    // Read draft_journal.json if it exists
    try {
      const draftContent = await fs.readFile(DRAFT_JSON_PATH, "utf-8");
      draftData = JSON.parse(draftContent);
    } catch (e) {
      // Return empty templates if draft doesn't exist
      draftData = {
        date: new Date().toISOString().split("T")[0],
        day: new Date().toLocaleDateString("en-US", { weekday: "long" }),
        accomplishments: { political: [], professional: [], personal: [], automation_dev: [] },
        todos: { medical_family: [], professional_political: [], other: [] },
        raw_trace: { imessage_count: 0, email_count: 0, git_commits: 0, calendar_events: 0 }
      };
    }

    // Read raw triage tasks
    try {
      const tasksContent = await fs.readFile(TRIAGE_TASKS_PATH, "utf-8");
      triageTasks = JSON.parse(tasksContent);
    } catch (e) {
      triageTasks = [];
    }

    return NextResponse.json({
      success: true,
      draft: draftData,
      rawTelemetry: triageTasks
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, draft, accomplishments, todos } = body;

    const todayStr = new Date().toISOString().split("T")[0];
    const dayName = new Date().toLocaleDateString("en-US", { weekday: "long" });

    if (action === "trigger") {
      // Trigger supervisor script asynchronously
      console.log("[+] Chronicle API: Triggering central supervisor script run...");
      // Using exec without blocking
      exec(`python3 ${SUPERVISOR_SCRIPT}`, (err, stdout, stderr) => {
        if (err) {
          console.error(`[-] Supervisor run failed: ${err.message}`);
          return;
        }
        console.log(`[+] Supervisor ran successfully:\n${stdout}`);
      });
      return NextResponse.json({ success: true, message: "Supervisor background run triggered." });
    }

    if (action === "save") {
      // Save changes back to draft_journal.json
      await fs.writeFile(DRAFT_JSON_PATH, JSON.stringify(draft, null, 4), "utf-8");
      
      // Update the YYYY-MM-DD-draft.md
      const draftMdPath = path.join(DAILY_JOURNAL_DIR, `${todayStr}-draft.md`);
      const mdContent = generateMarkdown(draft, todayStr, dayName, true);
      await fs.writeFile(draftMdPath, mdContent, "utf-8");

      return NextResponse.json({ success: true, message: "Draft saved successfully." });
    }

    if (action === "commit") {
      // Save the finalized YYYY-MM-DD.md markdown file
      const finalMdPath = path.join(DAILY_JOURNAL_DIR, `${todayStr}.md`);
      const mdContent = generateMarkdown(draft, todayStr, dayName, false);
      await fs.writeFile(finalMdPath, mdContent, "utf-8");

      // Optional: Clear inbox triage tasks or archive them after successful commit
      try {
        const archivedTasksPath = path.join(INBOX_DIR, "archived_triage_tasks.json");
        let existingArchived = [];
        try {
          const currentArchived = await fs.readFile(archivedTasksPath, "utf-8");
          existingArchived = JSON.parse(currentArchived);
        } catch (e) {}

        let currentTriage = [];
        try {
          const currentTriageContent = await fs.readFile(TRIAGE_TASKS_PATH, "utf-8");
          currentTriage = JSON.parse(currentTriageContent);
        } catch (e) {}

        if (currentTriage.length > 0) {
          const updatedArchived = [...existingArchived, ...currentTriage];
          await fs.writeFile(archivedTasksPath, JSON.stringify(updatedArchived, null, 4), "utf-8");
          await fs.writeFile(TRIAGE_TASKS_PATH, "[]", "utf-8"); // Clear active inbox
        }
      } catch (e) {
        console.error("[-] Failed to archive triage tasks:", e);
      }

      // Also clean up draft_journal.json since it has been successfully committed
      try {
        await fs.unlink(DRAFT_JSON_PATH);
        const draftMdPath = path.join(DAILY_JOURNAL_DIR, `${todayStr}-draft.md`);
        await fs.unlink(draftMdPath);
      } catch (e) {}

      return NextResponse.json({ success: true, message: "Journal successfully committed!" });
    }

    return NextResponse.json({ success: false, error: "Invalid action." }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

function generateMarkdown(draft: any, dateStr: string, dayName: string, isDraft: boolean) {
  const acc = draft.accomplishments || {};
  const t = draft.todos || {};
  const trace = draft.raw_trace || {};

  let md = `---
date: ${dateStr}
day: ${dayName}
pods: [personal, professional, political]
ingested_sources: [chat.db, imap-gmail, git-log, macos-calendar]
draft: ${isDraft}
---

# Daily Journal - ${dayName}, ${new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}${isDraft ? " (DRAFT)" : ""}

`;

  if (isDraft) {
    md += `> [!NOTE]
> This is an automated daily journal draft synthesized by Chronicle. Review and modify as needed inside the Dashboard before committing.

`;
  }

  md += `## 🎯 Strategic Accomplishments (Done)

### 🗳️ Campaign & Voter Outreach
`;
  if (acc.political && acc.political.length > 0) {
    acc.political.forEach((item: string) => { md += `- ${item}\n`; });
  } else {
    md += `- None recorded today.\n`;
  }

  md += `\n### 💼 Professional Consultations & Sales\n`;
  if (acc.professional && acc.professional.length > 0) {
    acc.professional.forEach((item: string) => { md += `- ${item}\n`; });
  } else {
    md += `- None recorded today.\n`;
  }

  md += `\n### 🏠 Family & Personal Logistics\n`;
  if (acc.personal && acc.personal.length > 0) {
    acc.personal.forEach((item: string) => { md += `- ${item}\n`; });
  } else {
    md += `- None recorded today.\n`;
  }

  md += `\n### ⚙️ Automation & Tooling Dev\n`;
  if (acc.automation_dev && acc.automation_dev.length > 0) {
    acc.automation_dev.forEach((item: string) => { md += `- ${item}\n`; });
  } else {
    md += `- None recorded today.\n`;
  }

  md += `\n---\n\n## 📋 Open Action Items (To-Dos)\n`;

  md += `\n### 🏥 Medical & Family Follow-ups\n`;
  if (t.medical_family && t.medical_family.length > 0) {
    t.medical_family.forEach((item: string) => { md += `- [ ] ${item}\n`; });
  } else {
    md += `- [ ] None pending.\n`;
  }

  md += `\n### 💼 Professional & Political Opportunities\n`;
  if (t.professional_political && t.professional_political.length > 0) {
    t.professional_political.forEach((item: string) => { md += `- [ ] ${item}\n`; });
  } else {
    md += `- [ ] None pending.\n`;
  }

  md += `\n### ⚙️ General & Administrative\n`;
  if (t.other && t.other.length > 0) {
    t.other.forEach((item: string) => { md += `- [ ] ${item}\n`; });
  } else {
    md += `- [ ] None pending.\n`;
  }

  md += `\n---\n\n## 🔍 Ingestion Trace (Audit Log)\n`;
  md += `- **iMessage Telemetry:** ${trace.imessage_count || 0} parsed incoming messages.\n`;
  md += `- **Email Telemetry:** ${trace.email_count || 0} flagged/unread email items.\n`;
  md += `- **Git Commit Logs:** ${trace.git_commits || 0} local codebase commits.\n`;
  md += `- **Calendar Event Ingest:** ${trace.calendar_events || 0} scheduled meetings.\n`;

  return md;
}
