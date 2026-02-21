import { NextResponse } from "next/server";
import { getLogsFromDb } from "@/lib/db";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
    try {
        const data = await getLogsFromDb();
        return NextResponse.json(data, {
            headers: {
                "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
                "Pragma": "no-cache",
                "Expires": "0",
                "Surrogate-Control": "no-store"
            }
        });
    } catch (e) {
        return NextResponse.json([], { status: 500 });
    }
}
