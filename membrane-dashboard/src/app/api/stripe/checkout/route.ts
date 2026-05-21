import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    // Decoupled self-healing checkout mock - redirecting straight to dashboard
    return NextResponse.redirect(new URL("/dashboard?success=true", req.url), { status: 303 });
  } catch (error) {
    console.error("Stripe Checkout Redirect Error:", error);
    return NextResponse.redirect(new URL("/dashboard", req.url), { status: 303 });
  }
}