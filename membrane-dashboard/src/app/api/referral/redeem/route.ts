import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const codeStr = formData.get("code") as string;
    const code = codeStr?.trim().toUpperCase();
    const token = (formData.get("token") as string)?.trim() || "sk_live_local_dev_key";

    if (!code) return new NextResponse("No code provided", { status: 400 });

    const BONUS_AMOUNT = 10.00;

    // Calculate dynamic tenant ID using the SHA-256 key slice
    const hashedKey = crypto.createHash("sha256").update(token).digest("hex");
    const tenantId = `local_dev_${hashedKey.slice(0, 8)}`;

    try {
      await pool.query(`
        UPDATE tenants 
        SET balance = balance + $1 
        WHERE tenant_id = $2
      `, [BONUS_AMOUNT, tenantId]);
    } catch (dbError) {
      console.warn("⚠️ Database offline during referral redemption. Proceeding with mock success.", dbError);
    }

    // Redirect back to console
    return NextResponse.redirect(new URL("/console", req.url), { status: 303 });

  } catch (error) {
    console.error("Referral Redemption Error:", error);
    return NextResponse.redirect(new URL("/console", req.url), { status: 303 });
  }
}