export interface ReportsKPIs {
    totalSent: number;
    avgOpenRate: number;
    ctr: number;
    unsubscribeRate: number;
    bounceRate: number;
}

export interface TrendPoint {
    date: string;
    opens: number;
    clicks: number;
}

export interface CampaignOption {
    id: string;
    name: string;
}

export interface CountryRow {
    country: string;
    count: number;
}

export interface CampaignComparisonRow {
    id: string;
    name: string;
    sent: number;
    opens: number;
    clicks: number;
    openRate: number;
    ctr: number;
}
