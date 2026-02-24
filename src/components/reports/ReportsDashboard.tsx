'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { MetricCard } from './MetricCard';
import {
    Mail,
    MousePointer,
    UserMinus,
    AlertCircle,
    TrendingUp,
    BarChart2,
    Calendar,
} from 'lucide-react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from 'recharts';
import type {
    ReportsKPIs,
    TrendPoint,
    CampaignOption,
    CountryRow,
    CampaignComparisonRow,
} from '@/types/reports';

function getDefaultDateRange(): { start: string; end: string } {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 30);
    return {
        start: start.toISOString().slice(0, 10),
        end: end.toISOString().slice(0, 10),
    };
}

export function ReportsDashboard() {
    const [dateRange, setDateRange] = useState(getDefaultDateRange);
    const [campaignId, setCampaignId] = useState<string | null>(null);
    const [country, setCountry] = useState<string | null>(null);

    const [kpis, setKpis] = useState<ReportsKPIs | null>(null);
    const [trends, setTrends] = useState<TrendPoint[]>([]);
    const [campaigns, setCampaigns] = useState<CampaignOption[]>([]);
    const [byCountry, setByCountry] = useState<CountryRow[]>([]);
    const [comparison, setComparison] = useState<CampaignComparisonRow[]>([]);

    const [loadingKpis, setLoadingKpis] = useState(true);
    const [loadingTrends, setLoadingTrends] = useState(true);
    const [loadingCampaigns, setLoadingCampaigns] = useState(true);
    const [loadingCountry, setLoadingCountry] = useState(true);
    const [loadingComparison, setLoadingComparison] = useState(true);

    const [error, setError] = useState<string | null>(null);

    const params = useCallback(() => {
        const p = new URLSearchParams();
        p.set('start', dateRange.start);
        p.set('end', dateRange.end);
        if (campaignId) p.set('campaignId', campaignId);
        return p.toString();
    }, [dateRange, campaignId]);

    const fetchKpis = useCallback(async () => {
        setLoadingKpis(true);
        try {
            const res = await fetch(`/api/reports/kpis?${params()}`);
            if (!res.ok) throw new Error(await res.text());
            const data = await res.json();
            setKpis(data);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to load KPIs');
        } finally {
            setLoadingKpis(false);
        }
    }, [params]);

    const fetchTrends = useCallback(async () => {
        setLoadingTrends(true);
        try {
            const res = await fetch(`/api/reports/trends?${params()}`);
            if (!res.ok) throw new Error(await res.text());
            const { data } = await res.json();
            setTrends(data || []);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to load trends');
        } finally {
            setLoadingTrends(false);
        }
    }, [params]);

    const fetchCampaigns = useCallback(async () => {
        setLoadingCampaigns(true);
        try {
            const res = await fetch('/api/reports/campaigns');
            if (!res.ok) throw new Error(await res.text());
            const { campaigns: list } = await res.json();
            setCampaigns(list || []);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to load campaigns');
        } finally {
            setLoadingCampaigns(false);
        }
    }, []);

    const fetchByCountry = useCallback(async () => {
        setLoadingCountry(true);
        try {
            const q = new URLSearchParams({ start: dateRange.start, end: dateRange.end });
            const res = await fetch(`/api/reports/by-country?${q.toString()}`);
            if (!res.ok) throw new Error(await res.text());
            const { data } = await res.json();
            setByCountry(data || []);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to load by country');
        } finally {
            setLoadingCountry(false);
        }
    }, [dateRange.start, dateRange.end]);

    const fetchComparison = useCallback(async () => {
        setLoadingComparison(true);
        try {
            const res = await fetch('/api/reports/campaign-comparison?limit=5');
            if (!res.ok) throw new Error(await res.text());
            const { campaigns: list } = await res.json();
            setComparison(list || []);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to load comparison');
        } finally {
            setLoadingComparison(false);
        }
    }, []);

    useEffect(() => {
        setError(null);
        fetchKpis();
        fetchTrends();
    }, [fetchKpis, fetchTrends]);

    useEffect(() => {
        fetchCampaigns();
        fetchByCountry();
        fetchComparison();
    }, [fetchCampaigns, fetchByCountry, fetchComparison]);

    const handleApplyDateRange = () => {
        setError(null);
        fetchKpis();
        fetchTrends();
        fetchByCountry();
    };

    return (
        <div className="max-w-7xl mx-auto space-y-8">
            {/* Filters */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Filters</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-wrap items-end gap-4">
                    <div className="flex flex-wrap items-end gap-2">
                        <div className="space-y-2">
                            <Label htmlFor="start">From</Label>
                            <Input
                                id="start"
                                type="date"
                                value={dateRange.start}
                                onChange={(e) =>
                                    setDateRange((prev) => ({ ...prev, start: e.target.value }))
                                }
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="end">To</Label>
                            <Input
                                id="end"
                                type="date"
                                value={dateRange.end}
                                onChange={(e) =>
                                    setDateRange((prev) => ({ ...prev, end: e.target.value }))
                                }
                            />
                        </div>
                        <Button onClick={handleApplyDateRange} variant="secondary" size="icon">
                            <Calendar className="h-4 w-4" />
                        </Button>
                    </div>
                    <div className="space-y-2">
                        <Label>Campaign</Label>
                        <Select
                            value={campaignId ?? 'all'}
                            onValueChange={(v) => setCampaignId(v === 'all' ? null : v)}
                        >
                            <SelectTrigger className="w-[200px]">
                                <SelectValue placeholder="All campaigns" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All campaigns</SelectItem>
                                {campaigns.map((c) => (
                                    <SelectItem key={c.id} value={c.id}>
                                        {c.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>Region / Country</Label>
                        <Select
                            value={country ?? 'all'}
                            onValueChange={(v) => setCountry(v === 'all' ? null : v)}
                        >
                            <SelectTrigger className="w-[200px]">
                                <SelectValue placeholder="All" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All</SelectItem>
                                {byCountry.map((r) => (
                                    <SelectItem key={r.country} value={r.country}>
                                        {r.country} ({r.count})
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {error && (
                <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-2 text-sm text-destructive">
                    {error}
                </div>
            )}

            {/* KPI Cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
                <MetricCard
                    title="Total Emails Sent"
                    value={kpis ? kpis.totalSent.toLocaleString() : '—'}
                    icon={Mail}
                    loading={loadingKpis}
                />
                <MetricCard
                    title="Avg Open Rate"
                    value={kpis ? `${kpis.avgOpenRate.toFixed(1)}%` : '—'}
                    icon={TrendingUp}
                    loading={loadingKpis}
                />
                <MetricCard
                    title="Click-Through Rate"
                    value={kpis ? `${kpis.ctr.toFixed(2)}%` : '—'}
                    icon={MousePointer}
                    loading={loadingKpis}
                />
                <MetricCard
                    title="Unsubscribe Rate"
                    value={kpis ? `${kpis.unsubscribeRate.toFixed(2)}%` : '—'}
                    icon={UserMinus}
                    loading={loadingKpis}
                />
                <MetricCard
                    title="Bounce Rate"
                    value={kpis ? `${kpis.bounceRate.toFixed(2)}%` : '—'}
                    icon={AlertCircle}
                    loading={loadingKpis}
                />
            </div>

            {/* Main chart */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <BarChart2 className="h-5 w-5" />
                        Open / Click trends
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {loadingTrends ? (
                        <div className="h-[300px] animate-pulse rounded bg-muted" />
                    ) : (
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={trends} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                <XAxis
                                    dataKey="date"
                                    tick={{ fontSize: 12 }}
                                    tickFormatter={(v) => (v ? v.slice(0, 7) : v)}
                                />
                                <YAxis tick={{ fontSize: 12 }} />
                                <Tooltip
                                    labelFormatter={(v) => v}
                                    formatter={(value: number) => [value, '']}
                                />
                                <Legend />
                                <Line
                                    type="monotone"
                                    dataKey="opens"
                                    name="Opens"
                                    stroke="hsl(var(--primary))"
                                    strokeWidth={2}
                                    dot={false}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="clicks"
                                    name="Clicks"
                                    stroke="hsl(var(--chart-2))"
                                    strokeWidth={2}
                                    dot={false}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    )}
                </CardContent>
            </Card>

            {/* Campaign comparison */}
            <Card>
                <CardHeader>
                    <CardTitle>Last 5 campaigns</CardTitle>
                </CardHeader>
                <CardContent>
                    {loadingComparison ? (
                        <div className="h-64 animate-pulse rounded bg-muted" />
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Campaign</TableHead>
                                        <TableHead className="text-right">Sent</TableHead>
                                        <TableHead className="text-right">Opens</TableHead>
                                        <TableHead className="text-right">Clicks</TableHead>
                                        <TableHead className="text-right">Open rate</TableHead>
                                        <TableHead className="text-right">CTR</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {comparison.map((row) => (
                                        <TableRow key={row.id}>
                                            <TableCell className="font-medium">{row.name}</TableCell>
                                            <TableCell className="text-right">
                                                {row.sent.toLocaleString()}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {row.opens.toLocaleString()}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {row.clicks.toLocaleString()}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {row.openRate.toFixed(1)}%
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {row.ctr.toFixed(2)}%
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
