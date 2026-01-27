'use client';

import React from 'react';
import { Brand } from '@/types';
import { motion } from 'framer-motion';
import { Settings, BarChart3, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface BrandCardProps {
    brand: Brand;
    onClick?: () => void;
    index?: number;
}

export const BrandCard: React.FC<BrandCardProps> = ({ brand, onClick, index = 0 }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ 
                delay: index * 0.05, 
                duration: 0.5, 
                ease: [0.16, 1, 0.3, 1] 
            }}
            whileHover={{ 
                y: -8,
                transition: { duration: 0.3, ease: "easeOut" }
            }}
            onClick={onClick}
            className="group relative overflow-hidden rounded-2xl border border-white/10 glass cursor-pointer transition-all duration-300"
        >
            {/* Soft outer glow on hover */}
            <motion.div
                className="absolute -inset-0.5 bg-gradient-to-br from-primary/20 via-violet-500/20 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-500"
                initial={false}
            />

            {/* Inner glow effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

            <div className="p-6 relative z-10">
                {/* Header Section */}
                <div className="flex justify-between items-start mb-6">
                    {/* Brand Logo Placeholder */}
                    <div className="relative">
                        <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-primary via-violet-600 to-purple-700 flex items-center justify-center text-white shadow-lg ring-2 ring-white/20 group-hover:ring-primary/40 transition-all duration-300 group-hover:scale-110">
                            <span className="text-xl font-bold tracking-tight">
                                {brand.name.substring(0, 2).toUpperCase()}
                            </span>
                        </div>
                        {/* Subtle shine effect */}
                        <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </div>

                    {/* Status Badge with Glow */}
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-success/10 border border-success/30 backdrop-blur-md shadow-lg shadow-success/20">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-success shadow-[0_0_8px_rgba(16,185,129,0.6)]"></span>
                        </span>
                        <span className="text-[10px] font-semibold text-success uppercase tracking-wider">
                            Active
                        </span>
                    </div>
                </div>

                {/* Brand Info */}
                <div className="space-y-2 mb-6">
                    <h3 className="text-xl font-semibold text-foreground group-hover:text-primary transition-colors duration-300 leading-tight">
                        {brand.name}
                    </h3>
                    <p className="text-xs text-muted-foreground font-mono opacity-70">
                        ID: {brand.id}
                    </p>
                </div>

                {/* Quick Actions */}
                <div className="flex items-center gap-2 pt-5 border-t border-white/10">
                    <motion.div
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-9 w-9 p-0 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-all duration-200"
                            onClick={(e) => {
                                e.stopPropagation();
                                // Handle edit
                            }}
                        >
                            <Edit className="h-4 w-4" />
                        </Button>
                    </motion.div>
                    <motion.div
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-9 w-9 p-0 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-all duration-200"
                            onClick={(e) => {
                                e.stopPropagation();
                                // Handle analytics
                            }}
                        >
                            <BarChart3 className="h-4 w-4" />
                        </Button>
                    </motion.div>
                    <div className="flex-1" />
                    <motion.div
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-9 w-9 p-0 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-all duration-200"
                            onClick={(e) => {
                                e.stopPropagation();
                                // Handle settings
                            }}
                        >
                            <Settings className="h-4 w-4" />
                        </Button>
                    </motion.div>
                </div>
            </div>
        </motion.div>
    );
};
