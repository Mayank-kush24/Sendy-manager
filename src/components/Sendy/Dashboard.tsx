'use client';

import React, { useState } from 'react';
import { useSendy } from '@/context/SendyContext';
import { BrandGrid } from './BrandGrid';
import { ListGrid } from './ListGrid';
import { CSVUploader } from '../Upload/CSVUploader';
import { HistoryList } from './HistoryList';
import { Brand, SendyList } from '@/types';
import { LogOut, ChevronRight, Home, History, Zap } from 'lucide-react';

type ViewState = 'brands' | 'lists' | 'upload' | 'history';

export const Dashboard = () => {
    const { disconnect, config } = useSendy();
    const [view, setView] = useState<ViewState>('brands');
    const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null);
    const [selectedList, setSelectedList] = useState<SendyList | null>(null);

    const handleBrandSelect = (brand: Brand) => {
        setSelectedBrand(brand);
        setView('lists');
    };

    const handleListSelect = (list: SendyList) => {
        setSelectedList(list);
        setView('upload');
    };

    const goHome = () => {
        setView('brands');
        setSelectedBrand(null);
        setSelectedList(null);
    };

    const goToBrand = () => {
        setView('lists');
        setSelectedList(null);
    };

    return (
        <div className="min-h-screen" style={{ background: 'linear-gradient(180deg, #0f172a 0%, #1e1b4b 100%)' }}>
            {/* Header */}
            <header style={{
                position: 'sticky',
                top: 0,
                zIndex: 50,
                backdropFilter: 'blur(16px)',
                background: 'rgba(15, 23, 42, 0.8)',
                borderBottom: '1px solid rgba(255,255,255,0.05)'
            }}>
                <div className="container py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3 cursor-pointer" onClick={goHome}>
                        <div style={{
                            width: 36,
                            height: 36,
                            background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                            borderRadius: 10,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)'
                        }}>
                            <Zap size={20} className="text-white" />
                        </div>
                        <span className="font-bold text-lg">Sendy Manager</span>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setView('history')}
                            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
                        >
                            <History size={16} />
                            <span className="hidden sm:inline">History</span>
                        </button>

                        <div className="hidden sm:block text-xs text-slate-500 px-3 py-1.5 bg-slate-800/50 rounded-full">
                            {config?.url}
                        </div>

                        <button
                            onClick={disconnect}
                            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
                        >
                            <LogOut size={16} />
                            <span className="hidden sm:inline">Disconnect</span>
                        </button>
                    </div>
                </div>
            </header>

            {/* Breadcrumb */}
            <div className="container pt-6 pb-2">
                <nav className="flex items-center gap-1 text-sm">
                    <button
                        onClick={goHome}
                        className={`flex items-center gap-1.5 px-2 py-1 rounded transition-colors ${view === 'brands' ? 'text-white' : 'text-slate-400 hover:text-white'
                            }`}
                    >
                        <Home size={14} />
                        <span>Brands</span>
                    </button>

                    {selectedBrand && view !== 'history' && (
                        <>
                            <ChevronRight size={14} className="text-slate-600" />
                            <button
                                onClick={goToBrand}
                                className={`px-2 py-1 rounded transition-colors ${view === 'lists' ? 'text-white' : 'text-slate-400 hover:text-white'
                                    }`}
                            >
                                {selectedBrand.name}
                            </button>
                        </>
                    )}

                    {selectedList && view === 'upload' && (
                        <>
                            <ChevronRight size={14} className="text-slate-600" />
                            <span className="text-white px-2 py-1">{selectedList.name}</span>
                        </>
                    )}

                    {view === 'history' && (
                        <>
                            <ChevronRight size={14} className="text-slate-600" />
                            <span className="text-white px-2 py-1">History</span>
                        </>
                    )}
                </nav>
            </div>

            {/* Content */}
            <div className="container py-4">
                <div className="fade-in">
                    {view === 'brands' && <BrandGrid onSelect={handleBrandSelect} />}
                    {view === 'lists' && selectedBrand && <ListGrid brand={selectedBrand} onSelect={handleListSelect} />}
                    {view === 'upload' && selectedList && <CSVUploader list={selectedList} brandName={selectedBrand?.name || ''} />}
                    {view === 'history' && <HistoryList />}
                </div>
            </div>
        </div>
    );
};
