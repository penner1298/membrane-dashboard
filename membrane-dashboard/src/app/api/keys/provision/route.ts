import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import crypto from "crypto";

export async function POST() {
  try {
    const rawKey = `sk_live_${crypto.randomBytes(24).toString("hex")}`;
    const hashedKey = crypto.createHash("sha256").update(rawKey).digest("hex");
    const dynamicTenantId = `local_dev_${hashedKey.slice(0, 8)}`;

    if (process.env.DATABASE_URL) {
      try {
        await pool.query("BEGIN");
        await pool.query(`
          INSERT INTO tenants (tenant_id, api_key_hash, balance, total_saved, has_paid)
          VALUES ($1, $2, 10.00, 0, TRUE)
          ON CONFLICT (api_key_hash) DO NOTHING
        `, [dynamicTenantId, hashedKey]);
        await pool.query("COMMIT");
      } catch (dbError) {
        await pool.query("ROLLBACK").catch(() => {});
        console.warn("⚠️ Database offline during session key provisioning. Returning raw key.", dbError);
      }
    }

    return NextResponse.json({ apiKey: rawKey, tenantId: dynamicTenantId });
  } catch (error) {
    console.error("Failed to provision session key:", error);
    return NextResponse.json({ apiKey: "sk_live_mock_local_dev_key_provisioned" });
  }
}
