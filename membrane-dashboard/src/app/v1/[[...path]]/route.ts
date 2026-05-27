import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest, { params }: { params: Promise<{ path?: string[] }> }) {
  const resolvedParams = await params;
  return handleProxy(request, resolvedParams.path || []);
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ path?: string[] }> }) {
  const resolvedParams = await params;
  return handleProxy(request, resolvedParams.path || []);
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ path?: string[] }> }) {
  const resolvedParams = await params;
  return handleProxy(request, resolvedParams.path || []);
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ path?: string[] }> }) {
  const resolvedParams = await params;
  return handleProxy(request, resolvedParams.path || []);
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ path?: string[] }> }) {
  const resolvedParams = await params;
  return handleProxy(request, resolvedParams.path || []);
}

export async function HEAD(request: NextRequest, { params }: { params: Promise<{ path?: string[] }> }) {
  const resolvedParams = await params;
  return handleProxy(request, resolvedParams.path || []);
}

export async function OPTIONS(request: NextRequest, { params }: { params: Promise<{ path?: string[] }> }) {
  const resolvedParams = await params;
  return handleProxy(request, resolvedParams.path || []);
}

async function handleProxy(request: NextRequest, pathSegments: string[]) {
  const path = pathSegments.join("/");

  // Environment-aware backend routing (per audit plan)
  const apiBase = process.env.MEMBRANE_BACKEND_URL ||
                  (process.env.NODE_ENV === "development" ? "http://localhost:8000" : "https://membrane-wh1g.onrender.com");
  const targetUrl = `${apiBase}/v1/${path}${request.nextUrl.search}`;

  const headers = new Headers(request.headers);
  headers.delete("host"); // Avoid SSL certificate mismatch on upstream

  const init: RequestInit = {
    method: request.method,
    headers,
  };

  // Only GET and HEAD request methods cannot have a body
  if (request.method !== "GET" && request.method !== "HEAD") {
    try {
      init.body = await request.blob();
    } catch (e) {
      // Empty or unparseable body
    }
  }

  try {
    const res = await fetch(targetUrl, init);
    
    // Copy response headers and apply CORS configuration
    const resHeaders = new Headers(res.headers);
    resHeaders.set("Access-Control-Allow-Origin", "*");
    resHeaders.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS, HEAD, PATCH");
    resHeaders.set("Access-Control-Allow-Headers", "*");

    return new Response(res.body, {
      status: res.status,
      statusText: res.statusText,
      headers: resHeaders,
    });
  } catch (error: any) {
    console.error("API Proxy Error:", error);
    return NextResponse.json(
      { error: "Proxy connection failed", details: error.message },
      { status: 502 }
    );
  }
}
