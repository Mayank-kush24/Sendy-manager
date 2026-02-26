import { Brand, SendyList } from '@/types';

interface ApiConfig {
    url: string;
    apiKey: string;
}

export const sendyService = {
    getBrands: async ({ url, apiKey }: ApiConfig): Promise<Brand[]> => {
        const res = await fetch('/api/brands', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url, apiKey }),
        });
        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.error || 'Failed to fetch brands');
        }
        return res.json();
    },

    getLists: async ({ url, apiKey }: ApiConfig, brandId: string): Promise<SendyList[]> => {
        const res = await fetch('/api/lists', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url, apiKey, brandId }),
        });
        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.error || 'Failed to fetch lists');
        }
        return res.json();
    },

    subscribe: async (
        { url, apiKey }: ApiConfig,
        listId: string,
        email: string,
        name?: string,
        customFields?: Record<string, string>,
        timeout?: number
    ) => {
        const controller = new AbortController();
        const timeoutId = timeout ? setTimeout(() => controller.abort(), timeout) : null;

        try {
            const res = await fetch('/api/subscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url, apiKey, listId, email, name, customFields }),
                signal: controller.signal,
            });
            
            if (timeoutId) clearTimeout(timeoutId);
            
            if (!res.ok) {
                const errorData = await res.json().catch(() => ({ error: 'Network error' }));
                const error = new Error(errorData.error || 'Failed to subscribe');
                (error as any).status = res.status;
                throw error;
            }
            
            const data = await res.json();
            if (!data.success) {
                const error = new Error(data.error || 'Failed to subscribe');
                (error as any).status = data.status || 400;
                throw error;
            }
            return data;
        } catch (err: any) {
            if (timeoutId) clearTimeout(timeoutId);
            if (err.name === 'AbortError') {
                const timeoutError = new Error('Request timeout');
                (timeoutError as any).status = 408;
                throw timeoutError;
            }
            throw err;
        }
    },

    getSubscriberCount: async ({ url, apiKey }: ApiConfig, listId: string): Promise<number> => {
        const res = await fetch('/api/subscriber-count', {
            method: 'POST',
            body: JSON.stringify({ url, apiKey, listId }),
            headers: { 'Content-Type': 'application/json' },
        });
        const data = await res.json();
        return data.count || 0;
    },

    unsubscribe: async ({ url, apiKey }: ApiConfig, listId: string, email: string) => {
        const res = await fetch('/api/unsubscribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url, apiKey, listId, email }),
        });
        const data = await res.json();
        if (!data.success) {
            throw new Error(data.error || 'Failed to unsubscribe');
        }
        return data;
    },

    deleteSubscriber: async ({ url, apiKey }: ApiConfig, listId: string, email: string) => {
        const res = await fetch('/api/subscribers/delete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url, apiKey, listId, email }),
        });
        const data = await res.json();
        if (!data.success) {
            throw new Error(data.error || 'Failed to delete subscriber');
        }
        return data;
    },

    getSubscriptionStatus: async ({ url, apiKey }: ApiConfig, listId: string, email: string): Promise<string> => {
        const res = await fetch('/api/subscribers/status', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url, apiKey, listId, email }),
        });
        const data = await res.json();
        return data.status || 'Unknown';
    },

    createCampaign: async ({ url, apiKey }: ApiConfig, campaignData: any) => {
        const res = await fetch('/api/campaigns/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url, apiKey, ...campaignData }),
        });
        const data = await res.json();
        if (!data.success) {
            throw new Error(data.error || 'Failed to create campaign');
        }
        return data;
    }
};
