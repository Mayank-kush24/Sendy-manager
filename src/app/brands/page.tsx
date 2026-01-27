'use client';

import { BrandGrid } from '@/components/Sendy/BrandGrid';
import { useRouter } from 'next/navigation';
import { useSendy } from '@/context/SendyContext';
import { motion } from 'framer-motion';

export default function Page() {
    const router = useRouter();
    const { setSelectedBrand } = useSendy();

    return (
        <div className="max-w-7xl mx-auto space-y-8">
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
            >
                <h1 className="text-4xl font-bold tracking-tight mb-2 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                    Brands
                </h1>
                <p className="text-muted-foreground text-sm">
                    Manage your Sendy brands and access their resources
                </p>
            </motion.div>
            <BrandGrid onSelect={(brand) => {
                setSelectedBrand(brand);
                router.push('/lists');
            }} />
        </div>
    );
}
