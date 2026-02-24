'use client';

import { ReportsDashboard } from '@/components/reports/ReportsDashboard';
import { motion } from 'framer-motion';

export default function ReportsPage() {
    return (
        <div className="max-w-7xl mx-auto space-y-8">
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
            >
                <h1 className="text-4xl font-bold tracking-tight mb-2 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                    Analytics
                </h1>
                <p className="text-muted-foreground text-sm">
                    View KPIs, open/click trends, and campaign performance
                </p>
            </motion.div>
            <ReportsDashboard />
        </div>
    );
}
