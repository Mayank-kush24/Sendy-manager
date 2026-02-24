import { NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import { getTrendsFromDB } from '@/lib/reports-queries';
import { getMockTrends } from '@/lib/reports-mock';

function parseDate(value: string | null): Date | null {
    if (!value) return null;
    const d = new Date(value);
    return isNaN(d.getTime()) ? null : d;
}

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const start = searchParams.get('start');
        const end = searchParams.get('end');
        const campaignId = searchParams.get('campaignId') || null;

        if (start && end) {
            const startDate = parseDate(start);
            const endDate = parseDate(end);
            if (!startDate || !endDate) {
                return NextResponse.json({ error: 'Invalid date format' }, { status: 400 });
            }
            if (endDate < startDate) {
                return NextResponse.json({ error: 'end must be >= start' }, { status: 400 });
            }
        }

        const pool = await getPool();
        if (pool) {
            const data = await getTrendsFromDB(pool, start, end, campaignId);
            return NextResponse.json({ data });
        }

        const data = getMockTrends(start, end, campaignId);
        return NextResponse.json({ data });
    } catch {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
