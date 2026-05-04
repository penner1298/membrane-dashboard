import { NextResponse } from "next/server";
import Stripe from "stripe";
import { headers } from "next/headers";
import { Pool } from "pg";

// Initialize Stripe and Database
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
 apiVersion: "2026-04-22.dahlia",
});

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

export async function POST(req: Request) {
  const body = await req.text();
  const signature = (await headers()).get("Stripe-Signature") as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET as string
    );
  } catch (error: any) {
    console.error("Webhook signature verification failed:", error.message);
    return new NextResponse(`Webhook Error: ${error.message}`, { status: 400 });
  }

  // Catch the successful payment!
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    
    // Grab the user ID we attached earlier, and convert the payment from cents to dollars
    const clerkUserId = session.metadata?.clerkUserId;
    const amountAdded = (session.amount_total || 0) / 100; 

    if (clerkUserId) {
      const client = await pool.connect();
      try {
        await client.query("BEGIN");
        
        // 1. Add the money to their total balance
        await client.query(
          `UPDATE tenants SET balance = balance + $1 WHERE clerk_user_id = $2`,
          [amountAdded, clerkUserId]
        );
        
        // 2. Write the itemized receipt to the transactions ledger!
        await client.query(
          `INSERT INTO transactions (clerk_user_id, amount, description) VALUES ($1, $2, $3)`,
          [clerkUserId, amountAdded, `Stripe Top-Up`]
        );
        
        await client.query("COMMIT");
        console.log(`SUCCESS: Added $${amountAdded} to ${clerkUserId}`);
      } catch (e) {
        await client.query("ROLLBACK");
        console.error("Database Update Error:", e);
        return new NextResponse("Database Error", { status: 500 });
      } finally {
        client.release();
      }
    }
  }

  return new NextResponse("Webhook received", { status: 200 });
}