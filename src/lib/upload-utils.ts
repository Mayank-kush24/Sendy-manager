/**
 * Utility functions for CSV upload processing
 */

export interface RetryOptions {
    maxAttempts?: number;
    baseDelay?: number;
    maxDelay?: number;
    retryable?: (error: any) => boolean;
}

/**
 * Retry a function with exponential backoff
 */
export async function withRetry<T>(
    fn: () => Promise<T>,
    options: RetryOptions = {}
): Promise<T> {
    const {
        maxAttempts = 3,
        baseDelay = 1000,
        maxDelay = 10000,
        retryable = (error: any) => {
            // Retry on network errors, 5xx errors, or timeout errors
            if (error?.message?.includes('network') || 
                error?.message?.includes('timeout') ||
                error?.message?.includes('fetch')) {
                return true;
            }
            // Check for HTTP status codes
            if (error?.status >= 500) return true;
            return false;
        }
    } = options;

    let lastError: any;
    
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        try {
            return await fn();
        } catch (error: any) {
            lastError = error;
            
            // Don't retry on last attempt or if error is not retryable
            if (attempt === maxAttempts - 1 || !retryable(error)) {
                throw error;
            }
            
            // Calculate delay with exponential backoff
            const delay = Math.min(
                baseDelay * Math.pow(2, attempt),
                maxDelay
            );
            
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
    
    throw lastError;
}

/**
 * Delay utility
 */
export function delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Get configuration from environment variables with defaults
 */
export function getUploadConfig() {
    return {
        maxConcurrentRequests: parseInt(
            process.env.NEXT_PUBLIC_MAX_CONCURRENT_REQUESTS || '6',
            10
        ),
        batchSize: parseInt(
            process.env.NEXT_PUBLIC_BATCH_SIZE || '20',
            10
        ),
        retryAttempts: parseInt(
            process.env.NEXT_PUBLIC_RETRY_ATTEMPTS || '3',
            10
        ),
        batchDelayMs: parseInt(
            process.env.NEXT_PUBLIC_BATCH_DELAY_MS || '100',
            10
        ),
        requestTimeoutMs: parseInt(
            process.env.NEXT_PUBLIC_REQUEST_TIMEOUT_MS || '30000',
            10
        ),
    };
}

/**
 * Format bytes to human readable string
 */
export function formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Format time remaining
 */
export function formatTimeRemaining(seconds: number): string {
    if (seconds < 60) return `${Math.round(seconds)}s`;
    const minutes = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    if (minutes < 60) return `${minutes}m ${secs}s`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
}

/**
 * Calculate upload speed
 */
export function calculateSpeed(
    processed: number,
    startTime: number
): { rowsPerSecond: number; mbPerSecond: number } {
    const elapsed = (Date.now() - startTime) / 1000; // seconds
    const rowsPerSecond = elapsed > 0 ? processed / elapsed : 0;
    // Estimate MB/s (assuming ~50 bytes per row average)
    const mbPerSecond = (rowsPerSecond * 50) / (1024 * 1024);
    return { rowsPerSecond, mbPerSecond };
}

