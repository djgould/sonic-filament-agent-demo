import { NextResponse } from "next/server";
import { getLogsFromBlob } from "@/lib/blobStore";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        const data = await getLogsFromBlob();
        return NextResponse.json(data);
    } catch (e) {
        return NextResponse.json([]);
    }
}
