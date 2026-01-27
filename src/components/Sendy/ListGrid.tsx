'use client';

import React, { useEffect, useState } from 'react';
import { useSendy } from '@/context/SendyContext';
import { sendyService } from '@/services/sendy';
import { Brand, SendyList } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Loader2, Users } from 'lucide-react';
import { motion } from 'framer-motion';

interface ListGridProps {
    brand: Brand;
    onSelect?: (list: SendyList) => void;
}

export const ListGrid: React.FC<ListGridProps> = ({ brand, onSelect }) => {
    const { config } = useSendy();
    const [lists, setLists] = useState<SendyList[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [search, setSearch] = useState('');
    const itemsPerPage = 12;

    useEffect(() => {
        const fetchLists = async () => {
            if (!config) return;
            try {
                const data = await sendyService.getLists(config, brand.id);
                setLists(data);
                setLoading(false);
            } catch (err: any) {
                if (err.message && err.message.includes('No lists found')) {
                    setLists([]);
                    setLoading(false);
                } else {
                    setError(err.message);
                    setLoading(false);
                }
            }
        };

        fetchLists();
    }, [config, brand.id]);

    // Reset page when search changes
    useEffect(() => {
        setCurrentPage(1);
    }, [search]);

    const filtered = lists.filter(l => l.name.toLowerCase().includes(search.toLowerCase()));

    const totalPages = Math.ceil(filtered.length / itemsPerPage);
    const paginatedLists = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    if (loading) return <div className="flex justify-center p-10"><Loader2 className="animate-spin text-primary" /></div>;
    if (error) return <div className="text-destructive p-4 bg-destructive/10 rounded-md">Error: {error}</div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Lists for {brand.name}</h2>
                    <p className="text-muted-foreground">{lists.length} lists total</p>
                </div>
                <input
                    type="text"
                    placeholder="Search lists..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 max-w-sm"
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {paginatedLists.map((list, index) => (
                    <motion.div
                        key={list.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.03 }}
                        onClick={() => {
                            if (onSelect) {
                                onSelect(list);
                            }
                        }}
                        className={onSelect ? "cursor-pointer" : ""}
                    >
                        <Card className="hover:shadow-md transition-shadow group">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium truncate pr-4">
                                    {list.name}
                                </CardTitle>
                                <Users className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-xs text-muted-foreground mb-2">ID: {list.id}</div>
                            </CardContent>
                        </Card>
                    </motion.div>
                ))}
                {filtered.length === 0 && !loading && (
                    <div className="col-span-full text-center text-muted-foreground py-10">
                        No lists found.
                    </div>
                )}
            </div>

            {totalPages > 1 && (
                <div className="flex items-center justify-center space-x-2 py-4">
                    <button
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="px-4 py-2 text-sm font-medium text-muted-foreground bg-background border rounded-md hover:bg-accent disabled:opacity-50"
                    >
                        Previous
                    </button>
                    <span className="text-sm text-muted-foreground">
                        Page {currentPage} of {totalPages}
                    </span>
                    <button
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="px-4 py-2 text-sm font-medium text-muted-foreground bg-background border rounded-md hover:bg-accent disabled:opacity-50"
                    >
                        Next
                    </button>
                </div>
            )}
        </div>
    );
};
