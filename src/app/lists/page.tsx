'use client';

import { ListGrid } from '@/components/Sendy/ListGrid';
import { useSendy } from '@/context/SendyContext';
import { useRouter } from 'next/navigation';

export default function Page() {
    const { selectedBrand, setSelectedList } = useSendy();
    const router = useRouter();

    if (!selectedBrand) {
        return (
            <div className="max-w-7xl mx-auto space-y-6">
                <h1 className="text-3xl font-bold tracking-tight">Lists</h1>
                <div className="text-center py-10">
                    <p className="text-muted-foreground mb-4">Please select a brand to view its lists.</p>
                    <button onClick={() => router.push('/brands')} className="text-primary hover:underline">Go to Brands</button>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            <h1 className="text-3xl font-bold tracking-tight">Lists</h1>
            <ListGrid brand={selectedBrand} onSelect={(list) => {
                setSelectedList(list);
                router.push('/subscribers');
            }} />
        </div>
    );
}
