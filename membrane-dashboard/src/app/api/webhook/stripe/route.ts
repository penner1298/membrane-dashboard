import { NextResponse } from "next/server";

export async function POST(req: Request) {
  console.log("🔔 Mock Stripe Webhook Pass-Through Hit");
  return new NextResponse("OK", { status: 200 });
}