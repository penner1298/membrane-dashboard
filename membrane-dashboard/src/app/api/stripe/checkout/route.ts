import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    // Redirect to Polar.sh product checkout flow
    return NextResponse.redirect("https://buy.polar.sh/polar_cl_t0KpWunjEvjQhxyrgH7UGHcFAaRmOq1Bd5DWY2P0EXd", { status: 303 });
  } catch (error) {
    console.error("Polar Checkout Redirect Error:", error);
    return NextResponse.redirect(new URL("/console", req.url), { status: 303 });
  }
}