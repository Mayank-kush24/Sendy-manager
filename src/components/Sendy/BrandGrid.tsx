'use client';

import React, { useEffect, useState } from 'react';
import { useSendy } from '@/context/SendyContext';
import { sendyService } from '@/services/sendy';
import { Brand } from '@/types';
import { BrandCard } from '../brands/BrandCard';
import { Loader2, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

interface BrandGridProps {
    onSelect?: (brand: Brand) => void;
}

// Skeleton Card Component
const SkeletonCard = ({ index }: { index: number }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05, duration: 0.4 }}
        className="group relative overflow-hidden rounded-2xl border border-white/10 glass"
    >
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-start">
                <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-muted to-muted/50 animate-pulse" />
                <div className="h-6 w-20 rounded-full bg-muted animate-pulse" />
            </div>
            <div className="space-y-2">
                <div className="h-6 w-3/4 rounded-lg bg-muted animate-pulse" />
                <div className="h-4 w-1/2 rounded bg-muted/50 animate-pulse" />
            </div>
            <div className="flex items-center gap-2 pt-5 border-t border-white/10">
                <div className="h-9 w-9 rounded-lg bg-muted animate-pulse" />
                <div className="h-9 w-9 rounded-lg bg-muted animate-pulse" />
                <div className="flex-1" />
                <div className="h-9 w-9 rounded-lg bg-muted animate-pulse" />
            </div>
        </div>
    </motion.div>
);

export const BrandGrid: React.FC<BrandGridProps> = ({ onSelect }) => {
    const { config, setBrands, brands } = useSendy();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchBrands = async () => {
            if (!config) return;
            try {
                const data = await sendyService.getBrands(config);
                setBrands(data);
                setTimeout(() => setLoading(false), 600);
            } catch (err: any) {
                setError(err.message);
                setLoading(false);
            }
        };

        fetchBrands();
    }, [config, setBrands]);

    if (error) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center justify-center p-12 rounded-2xl border border-error/20 bg-error/5 text-destructive"
            >
                <AlertCircle className="h-12 w-12 mb-4 text-error" />
                <p className="font-semibold text-lg mb-2">Failed to load brands</p>
                <p className="text-sm opacity-80 text-center max-w-md">{error}</p>
            </motion.div>
        );
    }

    if (loading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {[...Array(8)].map((_, i) => (
                    <SkeletonCard key={i} index={i} />
                ))}
            </div>
        );
    }

    if (brands.length === 0) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center justify-center p-12 rounded-2xl border border-white/10 glass"
            >
                <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-primary/20 to-violet-600/20 flex items-center justify-center mb-4">
                    <Loader2 className="h-8 w-8 text-primary animate-spin" />
                </div>
                <p className="font-semibold text-lg mb-2 text-foreground">No brands found</p>
                <p className="text-sm text-muted-foreground text-center max-w-md">
                    Get started by creating your first brand or connecting to an existing Sendy instance.
                </p>
            </motion.div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {brands.map((brand, index) => (
                <BrandCard
                    key={brand.id}
                    brand={brand}
                    index={index}
                    onClick={() => onSelect?.(brand)}
                />
            ))}
        </div>
    );
};
