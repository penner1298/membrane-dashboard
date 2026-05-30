import crypto from "crypto";
import { NextResponse } from "next/server";

export function isProductionRuntime() {
  return (
    process.env.NODE_ENV === "production" ||
    process.env.VERCEL === "1" ||
    process.env.RENDER === "true" ||
    process.env.ENVIRONMENT === "production" ||
    process.env.ENV === "production"
  );
}

function readAdminToken(req: Request) {
  const bearer = req.headers.get("authorization") || "";
  if (bearer.toLowerCase().startsWith("bearer ")) {
    return bearer.slice(7).trim();
  }
  return req.headers.get("x-membrane-admin-token") || "";
}

function safeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return (
    leftBuffer.length === rightBuffer.length &&
    crypto.timingSafeEqual(leftBuffer, rightBuffer)
  );
}

export function requireAdminRequest(
  req: Request,
  options: { allowPublicInProduction?: boolean } = {}
) {
  if (!isProductionRuntime() || options.allowPublicInProduction) {
    return null;
  }

  const configuredToken = process.env.MEMBRANE_ADMIN_TOKEN || process.env.ADMIN_TOKEN || "";
  if (!configuredToken) {
    return NextResponse.json(
      { success: false, error: "Admin operation disabled: MEMBRANE_ADMIN_TOKEN is not configured." },
      { status: 503 }
    );
  }

  const providedToken = readAdminToken(req);
  if (!providedToken || !safeEqual(providedToken, configuredToken)) {
    return NextResponse.json(
      { success: false, error: "Unauthorized admin operation." },
      { status: 401 }
    );
  }

  return null;
}
