import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import Stripe from "stripe";

// Initialize Stripe with your Secret Key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2025-02-24.acacia", 
});

export async function POST(req: Request) {
  try {
    // 1. Verify the user is logged in
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // 2. Read the form data to see which button was clicked
    const formData = await req.formData();
    const amountStr = formData.get("amount") as string;
    
    // Default to $50 if something goes wrong, otherwise parse their choice
    const amountInDollars = parseInt(amountStr || "50", 10);

    // 3. Create the Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `Membrane API Credits ($${amountInDollars})`,
              description: "Prepaid API credits for Membrane Swarm.",
            },
            unit_amount: amountInDollars * 100, // Stripe expects cents!
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${req.headers.get("origin")}/?success=true`,
      cancel_url: `${req.headers.get("origin")}/?canceled=true`,
      metadata: {
        clerkUserId: userId, 
      },
    });

    // 4. Redirect the user to the Stripe hosted payment page
    return NextResponse.redirect(session.url!, { status: 303 });
  } catch (err: any) {
    console.error("Stripe Checkout Error:", err);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}