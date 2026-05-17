import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const response = await fetch("http://127.0.0.1:8001/api/swarm-ledger", {
      cache: "no-store", // Good practice to prevent aggressive caching on this dynamic data
    });
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Proxy error:", error);
    return NextResponse.json({ error: "Failed to fetch from backend" }, { status: 500 });
  }
}
