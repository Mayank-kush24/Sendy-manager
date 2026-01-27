'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useSendy } from '@/context/SendyContext';
import {
    LayoutDashboard,
    Users,
    List,
    Building2,
    Mail,
    Menu,
    LogOut,
    Zap,
    ChevronLeft,
    ChevronRight,
    Settings,
    User
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
    mobile?: boolean;
    onClose?: () => void;
}

export function Sidebar({ className, mobile, onClose }: SidebarProps) {
    const pathname = usePathname();
    const { disconnect, config, isConnected } = useSendy();
    const [isCollapsed, setIsCollapsed] = useState(false);

    if (!isConnected) return null;

    const items = [
        {
            title: "Dashboard",
            href: "/",
            icon: LayoutDashboard,
            active: pathname === "/"
        },
        {
            title: "Brands",
            href: "/brands",
            icon: Building2,
            active: pathname.startsWith("/brands")
        },
        {
            title: "Lists",
            href: "/lists",
            icon: List,
            active: pathname.startsWith("/lists")
        },
        {
            title: "Subscribers",
            href: "/subscribers",
            icon: Users,
            active: pathname.startsWith("/subscribers")
        },
        {
            title: "Campaigns",
            href: "/campaigns",
            icon: Mail,
            active: pathname.startsWith("/campaigns")
        }
    ];

    const activeItem = items.find(item => item.active);

    return (
        <div className={cn("flex h-full flex-col glass-sidebar relative", className)}>
            {/* Workspace Switcher */}
            <div className="h-16 flex items-center px-4 border-b border-white/10">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-violet-600 text-white shadow-lg ring-1 ring-white/20 flex-shrink-0">
                        <Zap className="h-4 w-4" />
                    </div>
                    <AnimatePresence mode="wait">
                        {!isCollapsed && (
                            <motion.div
                                initial={{ opacity: 0, width: 0 }}
                                animate={{ opacity: 1, width: 'auto' }}
                                exit={{ opacity: 0, width: 0 }}
                                transition={{ duration: 0.2 }}
                                className="overflow-hidden"
                            >
                                <div>
                                    <h2 className="text-sm font-semibold leading-none tracking-tight">Sendy Manager</h2>
                                    <p className="text-xs text-muted-foreground mt-1">Free Workspace</p>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
                {!mobile && (
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 flex-shrink-0"
                        onClick={() => setIsCollapsed(!isCollapsed)}
                    >
                        {isCollapsed ? (
                            <ChevronRight className="h-4 w-4" />
                        ) : (
                            <ChevronLeft className="h-4 w-4" />
                        )}
                    </Button>
                )}
            </div>

            {/* Navigation */}
            <ScrollArea className="flex-1 py-4 px-2">
                <div className="space-y-1 relative">
                    {/* Liquid active indicator */}
                    {activeItem && (
                        <motion.div
                            layoutId="activeIndicator"
                            className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-primary to-violet-600 rounded-r-full"
                            initial={false}
                            transition={{
                                type: "spring",
                                stiffness: 500,
                                damping: 30
                            }}
                            style={{
                                top: `${items.findIndex(item => item.active) * 2.5}rem`,
                                height: '2.5rem'
                            }}
                        />
                    )}

                    {items.map((item, index) => (
                        <motion.div
                            key={item.href}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                        >
                            <Button
                                variant="ghost"
                                className={cn(
                                    "relative w-full justify-start overflow-hidden transition-all duration-200",
                                    isCollapsed ? "px-2" : "px-3",
                                    item.active
                                        ? "bg-primary/10 text-primary hover:bg-primary/15 font-medium"
                                        : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                                )}
                                asChild
                                onClick={onClose}
                            >
                                <Link href={item.href}>
                                    <item.icon className={cn("h-4 w-4 flex-shrink-0", isCollapsed ? "mr-0" : "mr-3")} />
                                    <AnimatePresence mode="wait">
                                        {!isCollapsed && (
                                            <motion.span
                                                initial={{ opacity: 0, width: 0 }}
                                                animate={{ opacity: 1, width: 'auto' }}
                                                exit={{ opacity: 0, width: 0 }}
                                                transition={{ duration: 0.2 }}
                                                className="font-medium"
                                            >
                                                {item.title}
                                            </motion.span>
                                        )}
                                    </AnimatePresence>
                                </Link>
                            </Button>
                        </motion.div>
                    ))}
                </div>
            </ScrollArea>

            {/* User Profile & Footer */}
            <div className="p-4 border-t border-white/10 space-y-3">
                <AnimatePresence mode="wait">
                    {!isCollapsed && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.2 }}
                            className="space-y-3 overflow-hidden"
                        >
                            <div className="px-2">
                                <p className="text-xs font-medium text-muted-foreground mb-2">Connected to</p>
                                <div className="text-xs truncate bg-background/50 p-2 rounded-lg border border-white/10 font-mono">
                                    {config?.url}
                                </div>
                            </div>

                            {/* User Profile Section */}
                            <div className="px-2">
                                <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors cursor-pointer group">
                                    <Avatar className="h-8 w-8 ring-2 ring-primary/20 group-hover:ring-primary/40 transition-all">
                                        <AvatarImage src="" alt="User" />
                                        <AvatarFallback className="bg-gradient-to-br from-primary to-violet-600 text-white text-xs font-semibold">
                                            <User className="h-4 w-4" />
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium truncate">User Account</p>
                                        <p className="text-xs text-muted-foreground truncate">user@example.com</p>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <Settings className="h-3.5 w-3.5" />
                                    </Button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <Button
                    variant="ghost"
                    className={cn(
                        "w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10 transition-colors",
                        isCollapsed ? "px-2" : "px-3"
                    )}
                    onClick={() => {
                        disconnect();
                        onClose?.();
                    }}
                >
                    <LogOut className={cn("h-4 w-4 flex-shrink-0", isCollapsed ? "mr-0" : "mr-2")} />
                    <AnimatePresence mode="wait">
                        {!isCollapsed && (
                            <motion.span
                                initial={{ opacity: 0, width: 0 }}
                                animate={{ opacity: 1, width: 'auto' }}
                                exit={{ opacity: 0, width: 0 }}
                                transition={{ duration: 0.2 }}
                            >
                                Disconnect
                            </motion.span>
                        )}
                    </AnimatePresence>
                </Button>
            </div>
        </div>
    );
}

export function MobileSidebar() {
    return (
        <Sheet>
            <SheetTrigger asChild>
                <Button variant="ghost" className="md:hidden" size="icon">
                    <Menu className="h-5 w-5" />
                    <span className="sr-only">Toggle Menu</span>
                </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 text-sidebar-foreground bg-sidebar w-80">
                <Sidebar mobile onClose={() => { }} />
            </SheetContent>
        </Sheet>
    );
}
