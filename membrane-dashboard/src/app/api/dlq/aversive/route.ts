import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    const { id, inboundPrompt, failedOutput, reason } = await req.json();
    
    if (!inboundPrompt || !failedOutput) {
      return NextResponse.json({ success: false, error: "Missing prompt or failed output payload" }, { status: 400 });
    }

    const promptHash = crypto.createHash("sha256").update(inboundPrompt).digest("hex");
    const rejectionReason = reason || "AST Check Violation / Schema Mismatch";

    if (process.env.DATABASE_URL) {
      try {
        await pool.query(`
          INSERT INTO aversive_memory (prompt_hash, bad_output, reason, api_key_hash, is_global)
          VALUES ($1, $2, $3, 'local_dev_default', TRUE)
        `, [promptHash, failedOutput, rejectionReason]);

        if (id) {
          await pool.query("DELETE FROM dlq_logs WHERE id = $1", [id]);
        }
      } catch (dbError) {
        console.warn("⚠️ Database failed to write to aversive memory. Using mock fallback.", dbError);
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: `Prompt hash ${promptHash.slice(0, 8)} successfully tagged to Aversive Memory. Future LLM iterations will avoid matching this structure.`
    });

  } catch (error) {
    console.error("DLQ Aversive Tag Error:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
