'use client';

import React, { useState, useEffect } from 'react';
import { Sidebar, MobileSidebar } from './Sidebar';
import { useSendy } from '@/context/SendyContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Bell } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function MainLayout({ children }: { children: React.ReactNode }) {
    const { isConnected } = useSendy();
    const [isSearchOpen, setIsSearchOpen] = useState(false);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setIsSearchOpen(true);
            }
            if (e.key === 'Escape') {
                setIsSearchOpen(false);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    if (!isConnected) {
        return <main className="min-h-screen bg-background relative z-10">{children}</main>;
    }

    return (
        <div className="flex min-h-screen w-full bg-transparent relative z-10">
            {/* Desktop Sidebar */}
            <div className="hidden md:block w-64 flex-shrink-0">
                <div className="fixed inset-y-0 left-0 w-64">
                    <Sidebar />
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0 md:ml-64">
                {/* Header */}
                <header className="sticky top-0 z-50 flex h-16 items-center justify-between gap-4 border-b border-white/10 glass backdrop-blur-xl px-4 lg:px-6">
                    <div className="flex items-center gap-4">
                        <MobileSidebar />
                        <div className="hidden md:flex items-center gap-2 text-sm text-muted-foreground">
                            <span className="font-semibold text-foreground">Dashboard</span>
                            <span>/</span>
                            <span>Overview</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Global Search */}
                        <div className="relative hidden sm:block">
                            <Button
                                variant="ghost"
                                className="w-64 justify-start text-muted-foreground hover:text-foreground hover:bg-white/5 border border-white/10 glass h-9"
                                onClick={() => setIsSearchOpen(true)}
                            >
                                <Search className="absolute left-3 h-4 w-4" />
                                <span className="pl-8 text-sm">Search...</span>
                                    <div className="absolute right-2 flex h-5 items-center gap-1 rounded border border-white/10 bg-background/50 px-1.5 font-mono text-[10px] font-medium">
                                        <span className="text-xs">⌘</span>
                                        <span className="text-xs">K</span>
                                    </div>
                            </Button>
                        </div>

                        {/* Notification Bell */}
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className="relative h-9 w-9 text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors"
                        >
                            <Bell className="h-5 w-5" />
                            <motion.span
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-error ring-2 ring-background"
                            />
                        </Button>
                    </div>
                </header>

                <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto">
                    {children}
                </main>
            </div>

            {/* Search Modal */}
            <AnimatePresence>
                {isSearchOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
                        onClick={() => setIsSearchOpen(false)}
                    >
                        <motion.div
                            initial={{ opacity: 0, y: -20, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -20, scale: 0.95 }}
                            className="absolute top-20 left-1/2 -translate-x-1/2 w-full max-w-2xl"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="glass rounded-xl border border-white/10 shadow-2xl p-2">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        type="search"
                                        placeholder="Search brands, lists, subscribers..."
                                        className="w-full pl-10 pr-12 h-12 bg-background/50 border-white/10 focus-visible:ring-primary text-base"
                                        autoFocus
                                    />
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex h-6 items-center gap-1 rounded border border-white/10 bg-muted px-1.5 font-mono text-[10px] font-medium">
                                        <span className="text-xs">⌘</span>
                                        <span className="text-xs">K</span>
                                    </div>
                                </div>
                                <div className="mt-2 p-2 text-sm text-muted-foreground">
                                    <p>Search results will appear here...</p>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
