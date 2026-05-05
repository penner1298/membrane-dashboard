import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server"; // 👇 FIXED: This is the correct import!
import { pool } from "@/lib/db";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // 1. Generate a secure, 48-character raw key
    const rawKey = `sk_live_${crypto.randomBytes(24).toString("hex")}`;
    
    // 2. Hash it with SHA-256 (This matches your Python backend exactly!)
    const hashedKey = crypto.createHash("sha256").update(rawKey).digest("hex");
    
    // 3. Generate a random referral code just in case this is a brand new user account
    const refCode = `REF-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;

    // 4. Save the HASH to the database (Never save the raw key!)
    await pool.query(`
      INSERT INTO tenants (clerk_user_id, api_key_hash, referral_code)
      VALUES ($1, $2, $3)
      ON CONFLICT (clerk_user_id) 
      DO UPDATE SET api_key_hash = EXCLUDED.api_key_hash
    `, [userId, hashedKey, refCode]);

    // 5. Redirect back to the dashboard, passing the raw key in a self-destructing cookie
    const response = NextResponse.redirect(new URL("/dashboard", req.url), { status: 303 });
    response.cookies.set("new_api_key", rawKey, { 
      maxAge: 10, // ⏳ Self-destructs in 10 seconds!
      httpOnly: true,
      secure: process.env.NODE_ENV === "production"
    });
    
    return response;

  } catch (error) {
    console.error("Key Generator Error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}