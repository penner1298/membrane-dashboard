import { NextResponse } from "next/server";
import Stripe from "stripe";
import { pool } from "@/lib/db";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2024-04-10",
});

export async function POST(req: Request) {
  console.log("🔔 WEBHOOK HIT: Someone is knocking at the door...");
  
  const payload = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    console.error("❌ WEBHOOK ERROR: No signature found.");
    return new NextResponse("No signature", { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      payload,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET as string
    );
    console.log("✅ WEBHOOK VERIFIED: Signature matches!");
  } catch (err: any) {
    console.error(`🚨 WEBHOOK VERIFICATION FAILED:`, err.message);
    console.error(`Did you copy the exact 'whsec_...' from the Stripe CLI?`);
    return new NextResponse("Webhook Error", { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    
    const clerkUserId = session.metadata?.clerk_user_id;
    const amountPaid = session.amount_total ? session.amount_total / 100 : 0;

    console.log(`💰 PAYMENT CAUGHT: $${amountPaid} for user ${clerkUserId || "UNKNOWN"}`);

    if (clerkUserId && amountPaid > 0) {
      try {
        await pool.query(
          "UPDATE tenants SET balance = balance + $1 WHERE clerk_user_id = $2",
          [amountPaid, clerkUserId]
        );
        console.log(`🏦 SUCCESS: Added $${amountPaid} to DB for ${clerkUserId}`);
      } catch (dbError) {
        console.error("🔥 DATABASE ERROR:", dbError);
        return new NextResponse("Database Error", { status: 500 });
      }
    } else {
      console.error("⚠️ WARNING: clerkUserId was missing from the Stripe session metadata!");
    }
  }

  return new NextResponse("OK", { status: 200 });
}