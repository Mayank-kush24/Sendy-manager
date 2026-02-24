import type { RowDataPacket } from 'mysql2';
import type mysql from 'mysql2/promise';
import type {
    ReportsKPIs,
    TrendPoint,
    CampaignOption,
    CountryRow,
    CampaignComparisonRow,
} from '@/types/reports';
import { getTablePrefix, getRecipientColumn } from './db';

const prefix = () => getTablePrefix();
const recipientCol = () => getRecipientColumn();

// Sendy campaigns table: id, app, title/subject, sent (datetime or unix), to_send/recipients, opens (text)
// Subscribers: id, list, email, country (if present)
// Links: campaign_id, optional click count

function campaignsTable(): string {
    return `${prefix()}campaigns`;
}

function subscribersTable(): string {
    return `${prefix()}subscribers`;
}

function linksTable(): string {
    return `${prefix()}links`;
}

// Opens in Sendy are often stored as comma-separated "id:country"; count = number of entries
function opensCountExpr(opensCol: string): string {
    return `(CASE WHEN ${opensCol} IS NULL OR TRIM(${opensCol}) = '' THEN 0 ELSE (LENGTH(${opensCol}) - LENGTH(REPLACE(${opensCol}, ',', '')) + 1) END)`;
}

export async function getKPIsFromDB(
    pool: mysql.Pool,
    start: string | null,
    end: string | null,
    campaignId: string | null
): Promise<ReportsKPIs | null> {
    const tbl = campaignsTable();
    const opensExpr = opensCountExpr('opens');
    const recCol = recipientCol();
    const sentCol = 'sent';

    const startDate = start ? `${start} 00:00:00` : null;
    const endDate = end ? `${end} 23:59:59` : null;

    let whereClause = '1=1';
    const params: (string | number)[] = [];

    if (startDate && endDate) {
        whereClause += ` AND ${sentCol} >= ? AND ${sentCol} <= ?`;
        params.push(startDate, endDate);
    }
    if (campaignId) {
        whereClause += ' AND id = ?';
        params.push(campaignId);
    }

    try {
        const [rows] = await pool.query<RowDataPacket[]>(
            `SELECT
                COALESCE(SUM(${recCol}), 0) AS totalSent,
                COALESCE(SUM(${opensExpr}), 0) AS totalOpens,
                COUNT(*) AS campaignCount
            FROM ${tbl}
            WHERE ${whereClause} AND (${sentCol} IS NOT NULL AND ${sentCol} != '')`,
            params
        );

        const row = rows[0];
        if (!row) {
            return {
                totalSent: 0,
                avgOpenRate: 0,
                ctr: 0,
                unsubscribeRate: 0,
                bounceRate: 0,
            };
        }

        const totalSent = Number(row.totalSent) || 0;
        const totalOpens = Number(row.totalOpens) || 0;
        const avgOpenRate = totalSent > 0 ? (totalOpens / totalSent) * 100 : 0;

        // Clicks: sum from links for these campaigns (links table has campaign_id; may have clicks column or count rows)
        let totalClicks = 0;
        const [clickRows] = await pool.query<RowDataPacket[]>(
            `SELECT COALESCE(SUM(l.clicks), COUNT(*), 0) AS totalClicks FROM ${linksTable()} l WHERE l.campaign_id IN (SELECT id FROM ${tbl} WHERE ${whereClause} AND (${sentCol} IS NOT NULL AND ${sentCol} != ''))`,
            params
        ).catch(() => [[{ totalClicks: 0 }]]);
        totalClicks = Number((clickRows as RowDataPacket[])?.[0]?.totalClicks) || 0;
        const ctr = totalSent > 0 ? (totalClicks / totalSent) * 100 : 0;

        // Bounces/unsubscribes: if columns exist
        const [extraRows] = await pool.query<RowDataPacket[]>(
            `SELECT
                COALESCE(SUM(bounces), 0) AS bounces,
                COALESCE(SUM(unsubscribes), 0) AS unsubscribes
            FROM ${tbl}
            WHERE ${whereClause}`,
            params
        ).catch(() => [[{ bounces: 0, unsubscribes: 0 }]]);

        const extra = (extraRows as RowDataPacket[])?.[0];
        const bounces = Number(extra?.bounces) || 0;
        const unsubscribes = Number(extra?.unsubscribes) || 0;
        const bounceRate = totalSent > 0 ? (bounces / totalSent) * 100 : 0;
        const unsubscribeRate = totalSent > 0 ? (unsubscribes / totalSent) * 100 : 0;

        return {
            totalSent,
            avgOpenRate,
            ctr,
            unsubscribeRate,
            bounceRate,
        };
    } catch {
        return null;
    }
}

export async function getTrendsFromDB(
    pool: mysql.Pool,
    start: string | null,
    end: string | null,
    campaignId: string | null
): Promise<TrendPoint[]> {
    const tbl = campaignsTable();
    const opensExpr = opensCountExpr('opens');
    const sentCol = 'sent';
    const recCol = recipientCol();

    const startDate = start ? `${start} 00:00:00` : null;
    const endDate = end ? `${end} 23:59:59` : null;

    let whereClause = `(${sentCol} IS NOT NULL AND ${sentCol} != '')`;
    const params: (string | number)[] = [];
    if (startDate && endDate) {
        whereClause += ` AND ${sentCol} >= ? AND ${sentCol} <= ?`;
        params.push(startDate, endDate);
    }
    if (campaignId) {
        whereClause += ' AND id = ?';
        params.push(campaignId);
    }

    try {
        const [rows] = await pool.query<RowDataPacket[]>(
            `SELECT
                DATE(${sentCol}) AS date,
                COALESCE(SUM(${recCol}), 0) AS sent,
                COALESCE(SUM(${opensExpr}), 0) AS opens
            FROM ${tbl}
            WHERE ${whereClause}
            GROUP BY DATE(${sentCol})
            ORDER BY date`,
            params
        );

        // Clicks per day: join links and campaigns
        const dateList = (rows as RowDataPacket[]).map((r) => r.date);
        let clicksByDate: Record<string, number> = {};
        if (dateList.length > 0) {
            const placeholders = dateList.map(() => '?').join(',');
            const [clickRows] = await pool.query<RowDataPacket[]>(
                `SELECT DATE(c.${sentCol}) AS date, COALESCE(SUM(l.clicks), COUNT(*), 0) AS clicks
                 FROM ${linksTable()} l
                 JOIN ${tbl} c ON c.id = l.campaign_id
                 WHERE DATE(c.${sentCol}) IN (${placeholders})
                 GROUP BY DATE(c.${sentCol})`,
                dateList
            ).catch(() => []);
            (clickRows as RowDataPacket[] || []).forEach((r: RowDataPacket) => {
                const d = r.date ? String(r.date).slice(0, 10) : '';
                clicksByDate[d] = Number(r.clicks) || 0;
            });
        }

        return (rows as RowDataPacket[]).map((r) => {
            const dateStr = r.date ? String(r.date).slice(0, 10) : '';
            return {
                date: dateStr,
                opens: Number(r.opens) || 0,
                clicks: dateStr ? (clicksByDate[dateStr] ?? 0) : 0,
            };
        });
    } catch {
        return [];
    }
}

export async function getCampaignsFromDB(pool: mysql.Pool): Promise<CampaignOption[]> {
    const tbl = campaignsTable();
    try {
        const [rows] = await pool.query<RowDataPacket[]>(
            `SELECT id, COALESCE(title, subject, id) AS name FROM ${tbl} WHERE sent IS NOT NULL AND sent != '' ORDER BY sent DESC LIMIT 500`
        );
        return (rows as RowDataPacket[]).map((r) => ({
            id: String(r.id),
            name: String(r.name ?? r.title ?? r.subject ?? String(r.id)),
        }));
    } catch {
        return [];
    }
}

export async function getByCountryFromDB(
    pool: mysql.Pool,
    _start: string | null,
    _end: string | null
): Promise<CountryRow[]> {
    const tbl = subscribersTable();
    try {
        const [rows] = await pool.query<RowDataPacket[]>(
            `SELECT country AS country, COUNT(*) AS count FROM ${tbl} WHERE country IS NOT NULL AND country != '' GROUP BY country ORDER BY count DESC LIMIT 50`
        );
        return (rows as RowDataPacket[]).map((r) => ({
            country: String(r.country),
            count: Number(r.count) || 0,
        }));
    } catch {
        return [];
    }
}

export async function getCampaignComparisonFromDB(
    pool: mysql.Pool,
    limit: number
): Promise<CampaignComparisonRow[]> {
    const tbl = campaignsTable();
    const linksTbl = linksTable();
    const opensExpr = opensCountExpr('opens');
    const recCol = recipientCol();

    try {
        const [rows] = await pool.query<RowDataPacket[]>(
            `SELECT
                id,
                COALESCE(title, subject, id) AS name,
                COALESCE(${recCol}, 0) AS sent,
                ${opensExpr} AS opens
            FROM ${tbl}
            WHERE sent IS NOT NULL AND sent != ''
            ORDER BY sent DESC
            LIMIT ?`,
            [limit]
        );

        const campaigns = (rows as RowDataPacket[]) || [];
        const ids = campaigns.map((c) => c.id);
        let clicksMap: Record<string, number> = {};
        if (ids.length > 0) {
            const placeholders = ids.map(() => '?').join(',');
            const [clickRows] = await pool.query<RowDataPacket[]>(
                `SELECT campaign_id, COALESCE(SUM(clicks), COUNT(*), 0) AS total FROM ${linksTbl} WHERE campaign_id IN (${placeholders}) GROUP BY campaign_id`,
                ids
            ).catch(() => []);
            (clickRows as RowDataPacket[] || []).forEach((r: RowDataPacket) => {
                clicksMap[String(r.campaign_id)] = Number(r.total) || 0;
            });
        }

        return campaigns.map((c) => {
            const sent = Number(c.sent) || 0;
            const opens = Number(c.opens) || 0;
            const clicks = clicksMap[String(c.id)] ?? 0;
            return {
                id: String(c.id),
                name: String(c.name ?? c.title ?? c.id),
                sent,
                opens,
                clicks,
                openRate: sent > 0 ? (opens / sent) * 100 : 0,
                ctr: sent > 0 ? (clicks / sent) * 100 : 0,
            };
        });
    } catch {
        return [];
    }
}
