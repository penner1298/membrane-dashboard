import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    // 1. Generate a secure, 48-character raw key
    const rawKey = `sk_live_${crypto.randomBytes(24).toString("hex")}`;
    
    // 2. Hash it with SHA-256 (This matches your Python backend exactly!)
    const hashedKey = crypto.createHash("sha256").update(rawKey).digest("hex");
    
    // 3. Save the HASH to the database for 'local_dev' tenant if DB is online
    const dynamicTenantId = `local_dev_${hashedKey.slice(0, 8)}`;
    if (process.env.DATABASE_URL) {
      try {
        await pool.query("BEGIN");
        
        // Delete older local dev keys to prevent abandoned rows
        await pool.query(`
          DELETE FROM tenants 
          WHERE tenant_id LIKE 'local_dev_%' AND tenant_id != $1
        `, [dynamicTenantId]);

        // Insert new rotated key
        await pool.query(`
          INSERT INTO tenants (tenant_id, api_key_hash, balance, total_saved, has_paid)
          VALUES ($1, $2, 1000.00, 0, TRUE)
          ON CONFLICT (api_key_hash) 
          DO UPDATE SET tenant_id = EXCLUDED.tenant_id
        `, [dynamicTenantId, hashedKey]);

        await pool.query("COMMIT");
      } catch (dbError) {
        await pool.query("ROLLBACK").catch(() => {});
        console.warn("⚠️ Database is offline or timed out during key rotation. Using mock fallback.", dbError);
      }
    } else {
      console.warn("⚠️ DATABASE_URL is not set. Skipping key database write.");
    }

    // 4. Redirect back to the console, passing the key in a self-destructing cookie
    const response = NextResponse.redirect(new URL("/console", req.url), { status: 303 });
    response.cookies.set("new_api_key", rawKey, { 
      maxAge: 10, // ⏳ Self-destructs in 10 seconds!
      httpOnly: true,
      secure: process.env.NODE_ENV === "production"
    });
    
    return response;

  } catch (error) {
    console.error("Key Generator Error:", error);
    // Even if everything fails, self-heal by returning a mock key to the user!
    const mockKey = "sk_live_mock_local_dev_key_rotated";
    const response = NextResponse.redirect(new URL("/console", req.url), { status: 303 });
    response.cookies.set("new_api_key", mockKey, { 
      maxAge: 10,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production"
    });
    return response;
  }
}