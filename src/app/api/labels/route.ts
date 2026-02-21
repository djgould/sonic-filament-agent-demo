import { getDistinctLabels } from '@/lib/db';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const labels = await getDistinctLabels();
        return NextResponse.json(labels, {
            headers: {
                'Cache-Control': 'no-store, no-cache, must-revalidate',
            },
        });
    } catch (e) {
        console.error('Failed to fetch labels:', e);
        return NextResponse.json([], { status: 500 });
    }
}
