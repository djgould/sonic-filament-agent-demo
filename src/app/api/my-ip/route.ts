import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
    const ip =
        req.headers.get("x-real-ip") ||
        req.headers.get("x-forwarded-for") ||
        "::1"; // Default to localhost if unavailable

    return NextResponse.json({ ip });
}
