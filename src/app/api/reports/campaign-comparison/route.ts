import { NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import { getCampaignComparisonFromDB } from '@/lib/reports-queries';
import { getMockCampaignComparison } from '@/lib/reports-mock';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const limitParam = searchParams.get('limit');
        const limit = limitParam ? Math.min(10, Math.max(1, parseInt(limitParam, 10))) : 5;
        if (isNaN(limit)) {
            return NextResponse.json({ error: 'Invalid limit' }, { status: 400 });
        }

        const pool = await getPool();
        if (pool) {
            const campaigns = await getCampaignComparisonFromDB(pool, limit);
            if (campaigns.length > 0) return NextResponse.json({ campaigns });
        }
        const campaigns = getMockCampaignComparison(limit);
        return NextResponse.json({ campaigns });
    } catch {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
