'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { ScrollArea } from '../ui/scroll-area';

interface HistoryItem {
    timestamp: string;
    fileName: string;
    listName: string;
    brandName: string;
    stats: {
        total: number;
        success: number;
        failed: number;
        errors: string[];
    };
}

export const HistoryList = () => {
    const [history, setHistory] = useState<HistoryItem[]>([]);

    useEffect(() => {
        const data = localStorage.getItem('sendy_upload_history');
        if (data) {
            try {
                setHistory(JSON.parse(data));
            } catch (e) {
                console.error(e);
            }
        }
    }, []);

    if (history.length === 0) {
        return <div className="text-center text-muted-foreground py-10">No upload history found.</div>;
    }

    return (
        <div className="space-y-4">
            <h2 className="text-2xl font-bold mb-6">Upload History</h2>
            <div className="space-y-4">
                {history.map((item, idx) => (
                    <Card key={idx}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <div className="flex flex-col">
                                <CardTitle className="text-sm font-medium">
                                    {item.fileName || 'Unknown File'}
                                </CardTitle>
                                <span className="text-xs text-muted-foreground">
                                    {new Date(item.timestamp).toLocaleString()} • {item.brandName} &rarr; {item.listName}
                                </span>
                            </div>
                            <div className="flex space-x-2">
                                <Badge variant="secondary">{item.stats.success} Success</Badge>
                                {item.stats.failed > 0 && <Badge variant="destructive">{item.stats.failed} Failed</Badge>}
                            </div>
                        </CardHeader>
                    </Card>
                ))}
            </div>
        </div>
    );
};
