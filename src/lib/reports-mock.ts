import type {
    ReportsKPIs,
    TrendPoint,
    CampaignOption,
    CountryRow,
    CampaignComparisonRow,
} from '@/types/reports';

function parseDateParam(value: string | null): Date | null {
    if (!value) return null;
    const d = new Date(value);
    return isNaN(d.getTime()) ? null : d;
}

function toISODate(d: Date): string {
    return d.toISOString().slice(0, 10);
}

// Scale mock to match Sendy-style volumes (e.g. Dec 2025 ~1.2M+ total sent)
const SENT_PER_DAY_APPROX = 40000;

export function getMockKPIs(
    start: string | null,
    end: string | null,
    _campaignId: string | null
): ReportsKPIs {
    const startDate = start ? parseDateParam(start) : null;
    const endDate = end ? parseDateParam(end) : null;
    const days = startDate && endDate
        ? Math.max(1, Math.round((endDate.getTime() - startDate.getTime()) / 86400000))
        : 30;
    const base = SENT_PER_DAY_APPROX * Math.min(days, 90);
    const variance = Math.floor(base * 0.1 * (0.5 - Math.random()));
    return {
        totalSent: Math.max(0, base + variance),
        avgOpenRate: 22 + Math.random() * 15,
        ctr: 2 + Math.random() * 4,
        unsubscribeRate: 0.1 + Math.random() * 0.3,
        bounceRate: 1 + Math.random() * 2,
    };
}

export function getMockTrends(
    start: string | null,
    end: string | null,
    _campaignId: string | null
): TrendPoint[] {
    const startDate = start ? parseDateParam(start) : new Date(Date.now() - 30 * 86400000);
    const endDate = end ? parseDateParam(end) : new Date();
    const s = startDate || new Date(Date.now() - 30 * 86400000);
    const e = endDate || new Date();
    const days = Math.max(1, Math.round((e.getTime() - s.getTime()) / 86400000));
    const data: TrendPoint[] = [];
    const opensPerDay = 20000 + Math.floor(Math.random() * 60000);
    const clicksPerDay = Math.floor(opensPerDay * (0.03 + Math.random() * 0.08));
    for (let i = 0; i < Math.min(days, 90); i++) {
        const d = new Date(s);
        d.setDate(d.getDate() + i);
        if (d > e) break;
        const dayVary = 0.7 + Math.random() * 0.6;
        data.push({
            date: toISODate(d),
            opens: Math.floor(opensPerDay * dayVary),
            clicks: Math.floor(clicksPerDay * dayVary),
        });
    }
    return data;
}

export function getMockCampaigns(): CampaignOption[] {
    return [
        { id: '1', name: 'Weekly Digest #42' },
        { id: '2', name: 'Product Launch Q1' },
        { id: '3', name: 'Re-engagement Campaign' },
        { id: '4', name: 'Holiday Sale 2025' },
        { id: '5', name: 'Onboarding Series' },
    ];
}

export function getMockByCountry(
    _start: string | null,
    _end: string | null
): CountryRow[] {
    return [
        { country: 'United States', count: 12500 },
        { country: 'United Kingdom', count: 4200 },
        { country: 'India', count: 3800 },
        { country: 'Germany', count: 2100 },
        { country: 'Canada', count: 1800 },
        { country: 'Australia', count: 1500 },
        { country: 'France', count: 1200 },
        { country: 'Other', count: 2400 },
    ];
}

export function getMockCampaignComparison(limit: number): CampaignComparisonRow[] {
    const names = [
        'Weekly Digest #42',
        'Product Launch Q1',
        'Re-engagement Campaign',
        'Holiday Sale 2025',
        'Onboarding Series',
    ];
    return names.slice(0, Math.min(limit, names.length)).map((name, i) => {
        const sent = 80000 + Math.floor(Math.random() * 200000);
        const opens = Math.floor(sent * (0.18 + Math.random() * 0.15));
        const clicks = Math.floor(opens * (0.05 + Math.random() * 0.08));
        return {
            id: String(i + 1),
            name,
            sent,
            opens,
            clicks,
            openRate: (opens / sent) * 100,
            ctr: (clicks / sent) * 100,
        };
    });
}
