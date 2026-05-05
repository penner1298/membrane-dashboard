import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });

    const formData = await req.formData();
    const codeStr = formData.get("code") as string;
    const code = codeStr?.trim().toUpperCase();

    if (!code) return new NextResponse("No code provided", { status: 400 });

    // 1. Fetch the user trying to redeem the code
    const { rows: userRows } = await pool.query(
      "SELECT referral_code, referred_by FROM tenants WHERE clerk_user_id = $1", 
      [userId]
    );
    const currentUser = userRows[0];

    if (!currentUser) return new NextResponse("User not found", { status: 404 });
    if (currentUser.referred_by) return new NextResponse("You have already redeemed a code", { status: 400 });
    if (currentUser.referral_code === code) return new NextResponse("You cannot redeem your own code", { status: 400 });

    // 2. Find the owner of the code
    const { rows: ownerRows } = await pool.query(
      "SELECT clerk_user_id FROM tenants WHERE referral_code = $1", 
      [code]
    );
    const codeOwner = ownerRows[0];

    if (!codeOwner) return new NextResponse("Invalid referral code", { status: 404 });

    // 3. Success! Add $10 to both accounts and lock the redeemer's account
    const BONUS_AMOUNT = 10.00;

    // Start a database transaction so both updates happen safely at the same time
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      // Update the Redeemer (Give $10, lock referred_by)
      await client.query(`
        UPDATE tenants 
        SET balance = balance + $1, referred_by = $2 
        WHERE clerk_user_id = $3
      `, [BONUS_AMOUNT, code, userId]);

      // Update the Code Owner (Give $10)
      await client.query(`
        UPDATE tenants 
        SET balance = balance + $1 
        WHERE clerk_user_id = $2
      `, [BONUS_AMOUNT, codeOwner.clerk_user_id]);

      await client.query('COMMIT');
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }

    // Redirect back to dashboard
    return NextResponse.redirect(new URL("/dashboard", req.url), { status: 303 });

  } catch (error) {
    console.error("Referral Redemption Error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}