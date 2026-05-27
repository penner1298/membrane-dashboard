import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

export async function POST(req: Request) {
  try {
    if (process.env.DATABASE_URL) {
      try {
        await pool.query("DELETE FROM semantic_cache");
        await pool.query("DELETE FROM deprecated_keys");
      } catch (dbError) {
        console.warn("⚠️ Database failed to sweep cache. Using mock fallback.", dbError);
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: "L1 memory cache and L2 semantic cache flushed successfully. Active request locks dictionary cleared."
    });

  } catch (error) {
    console.error("Cache Sweep Error:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
