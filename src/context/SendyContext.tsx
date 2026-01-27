'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { SendyConfig, Brand, SendyList } from '../types';

interface SendyContextType {
    config: SendyConfig | null;
    isConnected: boolean;
    connect: (url: string, key: string) => void;
    disconnect: () => void;
    isLoading: boolean;
    brands: Brand[];
    setBrands: (brands: Brand[]) => void;
    selectedBrand: Brand | null;
    setSelectedBrand: (brand: Brand | null) => void;
    selectedList: SendyList | null;
    setSelectedList: (list: SendyList | null) => void;
}

const SendyContext = createContext<SendyContextType | undefined>(undefined);

export const SendyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [config, setConfig] = useState<SendyConfig | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [brands, setBrands] = useState<Brand[]>([]);
    const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null);
    const [selectedList, setSelectedList] = useState<SendyList | null>(null);

    useEffect(() => {
        // Load from local storage on mount
        const storedConfig = localStorage.getItem('sendy_config');
        if (storedConfig) {
            try {
                setConfig(JSON.parse(storedConfig));
            } catch (e) {
                console.error('Failed to parse sendy config', e);
            }
        }
        setIsLoading(false);
    }, []);

    const connect = (url: string, apiKey: string) => {
        // Normalize URL (remove trailing slash)
        const cleanUrl = url.replace(/\/$/, '');
        const newConfig = { url: cleanUrl, apiKey };
        setConfig(newConfig);
        localStorage.setItem('sendy_config', JSON.stringify(newConfig));
    };

    const disconnect = () => {
        setConfig(null);
        setBrands([]);
        setSelectedBrand(null);
        localStorage.removeItem('sendy_config');
    };

    return (
        <SendyContext.Provider value={{
            config,
            isConnected: !!config,
            connect,
            disconnect,
            isLoading,
            brands,
            setBrands,
            selectedBrand,
            setSelectedBrand,
            selectedList,
            setSelectedList
        }}>
            {children}
        </SendyContext.Provider>
    );
};

export const useSendy = () => {
    const context = useContext(SendyContext);
    if (context === undefined) {
        throw new Error('useSendy must be used within a SendyProvider');
    }
    return context;
};
