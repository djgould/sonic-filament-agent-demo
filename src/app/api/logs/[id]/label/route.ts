import { NextRequest, NextResponse } from "next/server";
import { getDb, initDb } from "@/lib/db";

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { label } = body;

        if (typeof label !== 'string' && label !== null) {
            return NextResponse.json({ error: "Invalid label value" }, { status: 400 });
        }

        const sql = getDb();
        await initDb();

        await sql`
      UPDATE agent_attribution_logs 
      SET label = ${label} 
      WHERE id = ${id}
    `;

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Failed to update label:", error);
        return NextResponse.json(
            { error: "Failed to update label" },
            { status: 500 }
        );
    }
}
