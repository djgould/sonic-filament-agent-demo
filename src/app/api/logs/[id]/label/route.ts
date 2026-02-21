import { NextRequest, NextResponse } from "next/server";
import { query, initDb } from "@/lib/db";

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

        await initDb();

        await query(`
            UPDATE agent_attribution_logs 
            SET label = $1 
            WHERE id = $2
        `, [label, id]);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Failed to update label:", error);
        return NextResponse.json(
            { error: "Failed to update label" },
            { status: 500 }
        );
    }
}
