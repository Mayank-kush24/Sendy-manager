import { NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import { getCampaignsFromDB } from '@/lib/reports-queries';
import { getMockCampaigns } from '@/lib/reports-mock';

export async function GET() {
    try {
        const pool = await getPool();
        if (pool) {
            const campaigns = await getCampaignsFromDB(pool);
            if (campaigns.length > 0) return NextResponse.json({ campaigns });
        }
        const campaigns = getMockCampaigns();
        return NextResponse.json({ campaigns });
    } catch {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
