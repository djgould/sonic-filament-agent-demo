import { NextRequest, NextResponse } from "next/server";
import { saveLogToDb, AttributionEvent } from "@/lib/db";

export async function GET(req: NextRequest) {
  return handleTracking(req);
}

export async function POST(req: NextRequest) {
  return handleTracking(req);
}

async function handleTracking(req: NextRequest) {
  const headers = Object.fromEntries(req.headers.entries());

  // Extract common agent indicators
  const userAgent = req.headers.get("user-agent") || null;

  // Try to get IP (vercel, standard forwarded, or direct)
  const ip =
    req.headers.get("x-real-ip") ||
    req.headers.get("x-forwarded-for") ||
    null;

  const event: AttributionEvent = {
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    ip,
    userAgent,
    headers,
    method: req.method,
    url: req.url,
  };

  try {
    await saveLogToDb(event);

    return NextResponse.json({
      success: true,
      message: "Request logged for attribution analysis",
      event
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      message: "Failed to save log",
      error: error.message
    }, { status: 500 });
  }
}
