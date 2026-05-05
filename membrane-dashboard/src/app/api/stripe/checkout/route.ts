import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2024-04-10", 
});

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });

    const formData = await req.formData();
    const amountStr = formData.get("amount") as string;
    const amount = parseInt(amountStr, 10);

    if (!amount || amount < 5) return new NextResponse("Minimum top-up is $5", { status: 400 });

    // Ensure this points to localhost in dev, or your real domain in prod
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [{
        price_data: {
          currency: "usd",
          product_data: { name: "Membrane API Credits", description: "Prepaid routing credits." },
          unit_amount: amount * 100, // Stripe uses cents
        },
        quantity: 1,
      }],
      mode: "payment",
      // 👇 FIX: Forcing the return path to be the dashboard!
      success_url: `${baseUrl}/dashboard?success=true`,
      cancel_url: `${baseUrl}/dashboard?canceled=true`,
      
      // 👇 CRITICAL: We pass the Clerk ID so the webhook knows who to give money to
      client_reference_id: userId,
      metadata: { clerk_user_id: userId },
    });

    if (!session.url) throw new Error("No session URL");
    return NextResponse.redirect(session.url, { status: 303 });

  } catch (error) {
    console.error("Stripe Checkout Error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}