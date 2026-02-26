'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import Papa from 'papaparse';
import pLimit from 'p-limit';
import { SendyList } from '@/types';
import { useSendy } from '@/context/SendyContext';
import { sendyService } from '@/services/sendy';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Input } from '../ui/input';
import { UploadCloud, CheckCircle, Download, AlertCircle, Play, Pause, Plus, X } from 'lucide-react';
import { clsx } from 'clsx';
import { motion } from 'framer-motion';
import { 
    withRetry, 
    delay, 
    getUploadConfig, 
    formatBytes, 
    formatTimeRemaining, 
    calculateSpeed 
} from '@/lib/upload-utils';

interface CSVUploaderProps {
    list: SendyList;
    brandName: string;
}

interface UploadStats {
    total: number;
    success: number;
    skipped: number;
    failed: number;
    errors: string[];
    retries: number;
}

interface FailedRow {
    email: string;
    name: string;
    error: string;
    row: number;
}

interface PerformanceMetrics {
    rowsPerSecond: number;
    mbPerSecond: number;
    averageLatency: number;
    startTime: number;
}

interface UploadProgress {
    fileName: string;
    listId: string;
    listName: string;
    brandName: string;
    processedRows: number;
    totalRows: number;
    stats: UploadStats;
    processedEmails: Set<string>;
    timestamp: string;
}

const config = getUploadConfig();

const SENDY_DEFAULT_FIELDS = ['Email', 'Name'] as const;
// Sentinel for "Don't map" – Radix Select doesn't allow empty string as item value
const DONT_MAP_VALUE = '__dont_map__';

export const CSVUploader: React.FC<CSVUploaderProps> = ({ list, brandName }) => {
    const { config: sendyConfig } = useSendy();
    const [file, setFile] = useState<File | null>(null);
    const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
    const [columnMapping, setColumnMapping] = useState<Record<string, string>>({ Email: '', Name: '' });
    const [customSendyFields, setCustomSendyFields] = useState<string[]>([]);
    const [newCustomFieldName, setNewCustomFieldName] = useState('');
    const [status, setStatus] = useState<'idle' | 'uploading' | 'paused' | 'completed' | 'error'>('idle');
    const [stats, setStats] = useState<UploadStats>({ 
        total: 0, 
        success: 0, 
        skipped: 0, 
        failed: 0, 
        errors: [],
        retries: 0
    });
    const [progress, setProgress] = useState(0);
    const [totalRows, setTotalRows] = useState(0);
    const [processedRows, setProcessedRows] = useState(0);
    const [eta, setEta] = useState<string>('');
    const [speed, setSpeed] = useState<{ rowsPerSecond: number; mbPerSecond: number }>({ 
        rowsPerSecond: 0, 
        mbPerSecond: 0 
    });
    const [failedRows, setFailedRows] = useState<FailedRow[]>([]);
    const [canResume, setCanResume] = useState(false);

    const bufferRef = useRef<any[]>([]);
    const statsRef = useRef<UploadStats>({ 
        total: 0, 
        success: 0, 
        skipped: 0, 
        failed: 0, 
        errors: [],
        retries: 0
    });
    const parserRef = useRef<Papa.ParseWorker | null>(null);
    const isPausedRef = useRef(false);
    const processedEmailsRef = useRef<Set<string>>(new Set());
    const performanceRef = useRef<PerformanceMetrics>({
        rowsPerSecond: 0,
        mbPerSecond: 0,
        averageLatency: 0,
        startTime: 0
    });
    const uploadIdRef = useRef<string>('');
    const lastUpdateRef = useRef<number>(0);
    const columnMappingRef = useRef<Record<string, string>>({});

    // Parse CSV headers when file is selected
    useEffect(() => {
        if (!file) {
            setCsvHeaders([]);
            setColumnMapping({ Email: '', Name: '' });
            setCustomSendyFields([]);
            return;
        }
        Papa.parse(file, {
            header: true,
            preview: 1,
            complete: (results) => {
                const headers = results.meta?.fields || [];
                setCsvHeaders(headers);
                const lower = (s: string) => (s || '').toLowerCase();
                setColumnMapping({
                    Email: headers.find((h) => lower(h) === 'email') || '',
                    Name: headers.find((h) => lower(h) === 'name') || '',
                });
            },
        });
    }, [file]);

    // Check for resumable upload on mount
    useEffect(() => {
        if (file) {
            checkForResume(file.name);
        }
    }, [file]);

    const checkForResume = (fileName: string) => {
        try {
            const saved = localStorage.getItem(`sendy_upload_${fileName}_${list.id}`);
            if (saved) {
                const progress: UploadProgress = JSON.parse(saved);
                if (progress.processedRows < progress.totalRows) {
                    setCanResume(true);
                    // Restore processed emails
                    processedEmailsRef.current = new Set(progress.processedEmails || []);
                }
            }
        } catch (e) {
            console.error('Failed to check resume data', e);
        }
    };

    const saveProgress = useCallback((totalRows: number) => {
        if (!file) return;
        
        try {
            const progress: UploadProgress = {
                fileName: file.name,
                listId: list.id,
                listName: list.name,
                brandName: brandName,
                processedRows: processedRows,
                totalRows: totalRows,
                stats: { ...statsRef.current },
                processedEmails: Array.from(processedEmailsRef.current),
                timestamp: new Date().toISOString()
            };
            localStorage.setItem(
                `sendy_upload_${file.name}_${list.id}`,
                JSON.stringify(progress)
            );
        } catch (e) {
            console.error('Failed to save progress', e);
        }
    }, [file, list, brandName, processedRows]);

    const clearProgress = useCallback(() => {
        if (!file) return;
        try {
            localStorage.removeItem(`sendy_upload_${file.name}_${list.id}`);
        } catch (e) {
            console.error('Failed to clear progress', e);
        }
    }, [file, list]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            resetState();
        }
    };

    const setMapping = (sendyField: string, csvColumn: string) => {
        setColumnMapping((prev) => ({ ...prev, [sendyField]: csvColumn }));
    };

    const addCustomSendyField = () => {
        const name = (newCustomFieldName || '').trim();
        if (!name || customSendyFields.includes(name) || SENDY_DEFAULT_FIELDS.includes(name)) return;
        setCustomSendyFields((prev) => [...prev, name]);
        setColumnMapping((prev) => ({ ...prev, [name]: '' }));
        setNewCustomFieldName('');
    };

    const removeCustomSendyField = (fieldName: string) => {
        setCustomSendyFields((prev) => prev.filter((f) => f !== fieldName));
        setColumnMapping((prev) => {
            const next = { ...prev };
            delete next[fieldName];
            return next;
        });
    };

    const resetState = () => {
        setStatus('idle');
        const initialStats = { 
            total: 0, 
            success: 0, 
            skipped: 0, 
            failed: 0, 
            errors: [],
            retries: 0
        };
        setStats(initialStats);
        statsRef.current = initialStats;
        setProgress(0);
        setProcessedRows(0);
        setTotalRows(0);
        setEta('');
        setSpeed({ rowsPerSecond: 0, mbPerSecond: 0 });
        setFailedRows([]);
        bufferRef.current = [];
        processedEmailsRef.current = new Set();
        isPausedRef.current = false;
        setCanResume(false);
        clearProgress();
    };

    const processRow = async (row: any, rowIndex: number): Promise<{ status: string; error?: string }> => {
        if (!sendyConfig) {
            return { status: 'failed', error: 'No configuration' };
        }

        const mapping = columnMappingRef.current;
        const emailCol = mapping['Email'];
        const nameCol = mapping['Name'];
        const email = emailCol ? (row[emailCol] || '').trim().toLowerCase() : '';
        const name = nameCol ? (row[nameCol] || '').trim() : '';

        if (!email) {
            return { status: 'failed', error: 'Missing email' };
        }

        // Skip if already processed (for resume)
        if (processedEmailsRef.current.has(email)) {
            return { status: 'skipped', error: 'Already processed' };
        }

        const customFields: Record<string, string> = {};
        for (const [sendyField, csvCol] of Object.entries(mapping)) {
            if (sendyField === 'Email' || sendyField === 'Name' || !csvCol) continue;
            const val = (row[csvCol] || '').trim();
            if (val) customFields[sendyField] = val;
        }

        const startTime = Date.now();

        try {
            const result = await withRetry(
                () => sendyService.subscribe(
                    sendyConfig,
                    list.id,
                    email,
                    name || undefined,
                    Object.keys(customFields).length > 0 ? customFields : undefined,
                    config.requestTimeoutMs
                ),
                {
                    maxAttempts: config.retryAttempts,
                    retryable: (error: any) => {
                        // Retry on network errors, timeouts, or 5xx errors
                        return error?.status >= 500 || 
                               error?.message?.includes('timeout') ||
                               error?.message?.includes('network') ||
                               error?.message?.includes('fetch');
                    }
                }
            );

            const latency = Date.now() - startTime;
            
            // Update average latency
            if (performanceRef.current.averageLatency === 0) {
                performanceRef.current.averageLatency = latency;
            } else {
                performanceRef.current.averageLatency = 
                    (performanceRef.current.averageLatency * 0.9) + (latency * 0.1);
            }
            
            processedEmailsRef.current.add(email);
            
            return { 
                status: result.status || 'subscribed'
            };
        } catch (err: any) {
            const errorMessage = err.message || 'Unknown error';
            
            // Track failed row for export
            setFailedRows(prev => [...prev, {
                email,
                name,
                error: errorMessage,
                row: rowIndex + 1
            }]);

            return { 
                status: 'failed', 
                error: errorMessage 
            };
        }
    };

    // Update stats with throttling for performance
    const updateStatsThrottled = useCallback(() => {
        const now = Date.now();
        // Update at most every 100ms for smooth but performant updates
        if (now - lastUpdateRef.current < 100) {
            return;
        }
        lastUpdateRef.current = now;

        // Use requestAnimationFrame for smooth UI updates
        requestAnimationFrame(() => {
            setProcessedRows(statsRef.current.total);
            setStats({ ...statsRef.current });

            // Update progress
            if (totalRows > 0) {
                const newProgress = Math.round((statsRef.current.total / totalRows) * 100);
                setProgress(newProgress);
            }

            // Update performance metrics
            if (performanceRef.current.startTime > 0) {
                const metrics = calculateSpeed(
                    statsRef.current.total,
                    performanceRef.current.startTime
                );
                setSpeed(metrics);
                performanceRef.current.rowsPerSecond = metrics.rowsPerSecond;
                performanceRef.current.mbPerSecond = metrics.mbPerSecond;

                // Calculate ETA
                if (totalRows > 0 && metrics.rowsPerSecond > 0) {
                    const remaining = totalRows - statsRef.current.total;
                    const secondsRemaining = remaining / metrics.rowsPerSecond;
                    setEta(formatTimeRemaining(secondsRemaining));
                }
            }
        });
    }, [totalRows]);

    const processBatch = async (rows: any[], resumeParser: () => void, startRowIndex: number) => {
        if (!sendyConfig || isPausedRef.current) return;

        // Create concurrency limiter
        const limit = pLimit(config.maxConcurrentRequests);

        // Process rows with concurrency control and update stats as each completes
        const promises = rows.map((row, batchIndex) => 
            limit(async () => {
                const rowIndex = startRowIndex + batchIndex;
                const result = await processRow(row, rowIndex);
                
                // Update stats immediately as each row completes
                const status = result.status;
                if (status === 'subscribed') {
                    statsRef.current.success++;
                } else if (status === 'skipped') {
                    statsRef.current.skipped++;
                } else if (status === 'failed') {
                    statsRef.current.failed++;
                    if (result.error) {
                        statsRef.current.errors = [
                            ...statsRef.current.errors,
                            result.error
                        ].slice(-100); // Keep last 100 errors
                    }
                }
                
                statsRef.current.total++;
                
                // Update UI dynamically - throttle internally for performance
                // This ensures stats update in real-time as rows complete
                updateStatsThrottled();
                
                return result;
            })
        );

        // Wait for all rows to complete
        await Promise.all(promises);

        // Force final update to ensure all stats are synced (bypass throttle)
        lastUpdateRef.current = 0;
        requestAnimationFrame(() => {
            setProcessedRows(statsRef.current.total);
            setStats({ ...statsRef.current });

            // Update progress
            if (totalRows > 0) {
                const newProgress = Math.round((statsRef.current.total / totalRows) * 100);
                setProgress(newProgress);
            }

            // Update performance metrics
            if (performanceRef.current.startTime > 0) {
                const metrics = calculateSpeed(
                    statsRef.current.total,
                    performanceRef.current.startTime
                );
                setSpeed(metrics);
                performanceRef.current.rowsPerSecond = metrics.rowsPerSecond;
                performanceRef.current.mbPerSecond = metrics.mbPerSecond;

                // Calculate ETA
                if (totalRows > 0 && metrics.rowsPerSecond > 0) {
                    const remaining = totalRows - statsRef.current.total;
                    const secondsRemaining = remaining / metrics.rowsPerSecond;
                    setEta(formatTimeRemaining(secondsRemaining));
                }
            }
        });

        // Save progress
        if (totalRows > 0) {
            saveProgress(totalRows);
        }

        // Clear processed batch from memory immediately
        rows.length = 0;

        // Rate limiting delay between batches
        if (config.batchDelayMs > 0) {
            await delay(config.batchDelayMs);
        }

        if (!isPausedRef.current) {
            resumeParser();
        }
    };

    const startUpload = async (resumeFromRow = 0) => {
        if (!file || !sendyConfig) return;

        columnMappingRef.current = { ...columnMapping };

        // Load resume data if resuming
        let resumeData: UploadProgress | null = null;
        if (resumeFromRow > 0) {
            try {
                const saved = localStorage.getItem(`sendy_upload_${file.name}_${list.id}`);
                if (saved) {
                    resumeData = JSON.parse(saved);
                    if (resumeData) {
                        statsRef.current = resumeData.stats;
                        setStats(resumeData.stats);
                        setProcessedRows(resumeData.processedRows);
                        processedEmailsRef.current = new Set(resumeData.processedEmails || []);
                    }
                }
            } catch (e) {
                console.error('Failed to load resume data', e);
            }
        } else {
            // Reset stats if not resuming
            const initialStats = { 
                total: 0, 
                success: 0, 
                skipped: 0, 
                failed: 0, 
                errors: [],
                retries: 0
            };
            setStats(initialStats);
            statsRef.current = initialStats;
            setProcessedRows(0);
            setFailedRows([]);
            processedEmailsRef.current = new Set();
        }

        setProgress(0);
        bufferRef.current = [];
        setStatus('uploading');
        isPausedRef.current = false;
        performanceRef.current.startTime = Date.now();
        uploadIdRef.current = `${Date.now()}_${file.name}`;
        lastUpdateRef.current = 0; // Reset throttling timer

        let currentRowIndex = 0;
        let rowsToSkip = resumeFromRow;

        // Parse and process
        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            worker: true, // Enable Web Worker
            step: async (results, parser) => {
                if (isPausedRef.current) {
                    parser.pause();
                    return;
                }

                currentRowIndex++;

                // Skip rows if resuming
                if (rowsToSkip > 0) {
                    rowsToSkip--;
                    return;
                }

                // Update total rows estimate on first real row
                if (currentRowIndex === 1 && totalRows === 0) {
                    // Estimate total rows from file size (rough estimate)
                    const estimatedRows = Math.max(100, Math.floor(file.size / 50));
                    setTotalRows(estimatedRows);
                }

                bufferRef.current.push({ data: results.data, index: currentRowIndex });

                // Update file-based progress
                if (file.size > 0 && results.meta && results.meta.cursor) {
                    const percent = Math.round((results.meta.cursor / file.size) * 100);
                    setProgress(percent);
                }

                if (bufferRef.current.length >= config.batchSize) {
                    parser.pause();
                    const batch = bufferRef.current.map(b => b.data);
                    const startIndex = bufferRef.current[0]?.index || 0;
                    bufferRef.current = [];
                    await processBatch(batch, () => {
                        if (!isPausedRef.current) {
                            parser.resume();
                        }
                    }, startIndex);
                }
            },
            complete: async () => {
                // Update total rows with actual count
                if (currentRowIndex > 0) {
                    setTotalRows(currentRowIndex);
                }

                const finalize = () => {
                    setStatus('completed');
                    setProgress(100);
                    saveHistory();
                    clearProgress();
                };

                if (bufferRef.current.length > 0 && !isPausedRef.current) {
                    const batch = bufferRef.current.map(b => b.data);
                    const startIndex = bufferRef.current[0]?.index || 0;
                    await processBatch(batch, finalize, startIndex);
                } else {
                    finalize();
                }
            },
            error: (error) => {
                console.error('CSV parsing error:', error);
                setStatus('error');
            }
        });
    };

    const pauseUpload = () => {
        isPausedRef.current = true;
        setStatus('paused');
        if (parserRef.current) {
            // Parser will be paused in step function
        }
    };

    const resumeUpload = () => {
        isPausedRef.current = false;
        setStatus('uploading');
        if (parserRef.current) {
            // Parser will resume in processBatch
        }
    };

    const exportFailedRows = () => {
        if (failedRows.length === 0) return;

        const csv = Papa.unparse(failedRows.map(row => ({
            Email: row.email,
            Name: row.name,
            Error: row.error,
            'Row Number': row.row
        })));

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `failed_rows_${new Date().toISOString()}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const saveHistory = () => {
        const historyItem = {
            timestamp: new Date().toISOString(),
            fileName: file?.name,
            listName: list.name,
            brandName: brandName,
            stats: statsRef.current,
            performance: performanceRef.current
        };
        const existing = localStorage.getItem('sendy_upload_history');
        const history = existing ? JSON.parse(existing) : [];
        history.unshift(historyItem);
        localStorage.setItem('sendy_upload_history', JSON.stringify(history.slice(0, 100)));
    };

    return (
        <Card className="max-w-3xl mx-auto">
            <CardHeader>
                <CardTitle>Upload Subscribers</CardTitle>
                <CardDescription>
                    Target List: <span className="font-medium text-foreground">{list.name}</span>
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="border-2 border-dashed border-input rounded-xl p-8 text-center bg-muted/50 mb-8 hover:bg-muted/70 transition-colors">
                    <input
                        type="file"
                        accept=".csv"
                        onChange={handleFileChange}
                        className="hidden"
                        id="csv-upload"
                        disabled={status === 'uploading' || status === 'paused'}
                    />
                    <label htmlFor="csv-upload" className={clsx("cursor-pointer block", (status === 'uploading' || status === 'paused') && "pointer-events-none opacity-50")}>
                        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary mx-auto mb-4">
                            <UploadCloud size={32} />
                        </div>
                        {file ? (
                            <div>
                                <div className="font-medium text-lg">{file.name}</div>
                                <div className="text-sm text-muted-foreground mt-1">
                                    {formatBytes(file.size)}
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className="font-medium text-lg">Click to Upload CSV</div>
                                <p className="text-muted-foreground text-sm mt-1">Map your CSV columns to Sendy fields in the next step</p>
                            </>
                        )}
                    </label>
                </div>

                {status === 'idle' && file && csvHeaders.length > 0 && (
                    <div className="space-y-4 mb-6">
                        <div className="text-sm font-medium text-foreground">Map CSV columns to Sendy fields</div>
                        <p className="text-muted-foreground text-sm">
                            Choose which CSV column goes to each Sendy field. Email is required.
                        </p>
                        <div className="space-y-3">
                            {SENDY_DEFAULT_FIELDS.map((sendyField) => (
                                <div key={sendyField} className="flex items-center gap-3">
                                    <Label className="w-24 shrink-0">
                                        {sendyField}
                                        {sendyField === 'Email' && <span className="text-destructive ml-0.5">*</span>}
                                    </Label>
                                    <Select
                                        value={columnMapping[sendyField] || DONT_MAP_VALUE}
                                        onValueChange={(val) => setMapping(sendyField, val === DONT_MAP_VALUE ? '' : val)}
                                    >
                                        <SelectTrigger className="flex-1">
                                            <SelectValue placeholder={sendyField === 'Email' ? 'Select column…' : '— Don\'t map'} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {sendyField !== 'Email' && (
                                                <SelectItem value={DONT_MAP_VALUE}>— Don&apos;t map</SelectItem>
                                            )}
                                            {csvHeaders.map((h) => (
                                                <SelectItem key={h} value={h}>
                                                    {h}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            ))}
                            {customSendyFields.map((fieldName) => (
                                <div key={fieldName} className="flex items-center gap-3">
                                    <Label className="w-24 shrink-0">{fieldName}</Label>
                                    <Select
                                        value={columnMapping[fieldName] || DONT_MAP_VALUE}
                                        onValueChange={(val) => setMapping(fieldName, val === DONT_MAP_VALUE ? '' : val)}
                                    >
                                        <SelectTrigger className="flex-1">
                                            <SelectValue placeholder="— Don't map" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value={DONT_MAP_VALUE}>— Don&apos;t map</SelectItem>
                                            {csvHeaders.map((h) => (
                                                <SelectItem key={h} value={h}>
                                                    {h}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="shrink-0 text-muted-foreground hover:text-destructive"
                                        onClick={() => removeCustomSendyField(fieldName)}
                                        aria-label={`Remove ${fieldName}`}
                                    >
                                        <X className="size-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            <Input
                                placeholder="e.g. UTM"
                                value={newCustomFieldName}
                                onChange={(e) => setNewCustomFieldName(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomSendyField())}
                                className="w-32"
                            />
                            <Button type="button" variant="outline" size="sm" onClick={addCustomSendyField}>
                                <Plus className="size-4 mr-1" />
                                Add Sendy field
                            </Button>
                            <span className="text-xs text-muted-foreground">
                                Add custom fields that exist on your Sendy list (e.g. UTM)
                            </span>
                        </div>
                    </div>
                )}

                {status === 'idle' && file && (
                    <div className="space-y-2">
                        <Button
                            onClick={() => startUpload(0)}
                            className="w-full text-lg py-6"
                            disabled={csvHeaders.length === 0 || !columnMapping['Email']}
                        >
                            {csvHeaders.length > 0 ? 'Confirm & Start Upload' : 'Preparing…'}
                        </Button>
                        {canResume && (
                            <Button 
                                onClick={() => {
                                    // Resume from saved progress
                                    try {
                                        const saved = localStorage.getItem(`sendy_upload_${file.name}_${list.id}`);
                                        if (saved) {
                                            const progress: UploadProgress = JSON.parse(saved);
                                            startUpload(progress.processedRows);
                                            setCanResume(false);
                                        }
                                    } catch (e) {
                                        console.error('Failed to resume upload', e);
                                    }
                                }} 
                                variant="outline" 
                                className="w-full"
                            >
                                Resume Previous Upload
                            </Button>
                        )}
                    </div>
                )}

                {(status === 'uploading' || status === 'paused' || status === 'completed') && (
                    <div className="space-y-6">
                        {/* Progress Bar */}
                        <div className="relative h-3 bg-secondary rounded-full overflow-hidden">
                            <motion.div
                                className="absolute top-0 left-0 h-full bg-primary"
                                initial={{ width: 0 }}
                                animate={{ width: `${progress}%` }}
                                transition={{ duration: 0.2 }}
                            />
                        </div>
                        
                        {/* Progress Info */}
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-muted-foreground">
                                {progress}% Complete
                                {totalRows > 0 && ` • ${processedRows} / ${totalRows} rows`}
                            </span>
                            {eta && status === 'uploading' && (
                                <span className="text-muted-foreground">ETA: {eta}</span>
                            )}
                        </div>

                        {/* Speed Metrics */}
                        {status === 'uploading' && speed.rowsPerSecond > 0 && (
                            <div className="text-center text-sm text-muted-foreground space-y-1">
                                <div>
                                    {speed.rowsPerSecond.toFixed(1)} rows/sec • {speed.mbPerSecond.toFixed(2)} MB/s
                                </div>
                                {performanceRef.current.averageLatency > 0 && (
                                    <div className="text-xs">
                                        Avg latency: {performanceRef.current.averageLatency.toFixed(0)}ms
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Control Buttons */}
                        {status === 'uploading' && (
                            <Button onClick={pauseUpload} variant="outline" className="w-full">
                                <Pause className="mr-2 h-4 w-4" />
                                Pause
                            </Button>
                        )}
                        {status === 'paused' && (
                            <Button onClick={resumeUpload} className="w-full">
                                <Play className="mr-2 h-4 w-4" />
                                Resume
                            </Button>
                        )}

                        {/* Stats Grid */}
                        <div className="grid grid-cols-4 gap-3">
                            <div className="bg-secondary p-4 rounded-lg text-center">
                                <div className="text-2xl font-bold">{stats.total}</div>
                                <div className="text-xs text-muted-foreground uppercase">Processed</div>
                            </div>
                            <div className="bg-green-500/10 p-4 rounded-lg text-center text-green-600 dark:text-green-400">
                                <div className="text-2xl font-bold">{stats.success}</div>
                                <div className="text-xs opacity-70 uppercase">Added</div>
                            </div>
                            <div className="bg-yellow-500/10 p-4 rounded-lg text-center text-yellow-600 dark:text-yellow-400">
                                <div className="text-2xl font-bold">{stats.skipped}</div>
                                <div className="text-xs opacity-70 uppercase">Skipped</div>
                            </div>
                            <div className="bg-red-500/10 p-4 rounded-lg text-center text-red-600 dark:text-red-400">
                                <div className="text-2xl font-bold">{stats.failed}</div>
                                <div className="text-xs opacity-70 uppercase">Failed</div>
                            </div>
                        </div>

                        {/* Error Export */}
                        {failedRows.length > 0 && (
                            <Button 
                                onClick={exportFailedRows} 
                                variant="outline" 
                                className="w-full"
                            >
                                <Download className="mr-2 h-4 w-4" />
                                Export {failedRows.length} Failed Rows
                            </Button>
                        )}

                        {/* Error Display */}
                        {stats.errors.length > 0 && (
                            <div className="bg-destructive/10 border border-destructive/20 p-4 rounded-lg">
                                <div className="flex items-center gap-2 mb-2">
                                    <AlertCircle className="text-destructive h-4 w-4" />
                                    <div className="font-bold text-destructive">Recent Errors</div>
                                </div>
                                <div className="text-sm text-destructive/80 max-h-32 overflow-y-auto">
                                    {stats.errors.slice(-5).map((error, i) => (
                                        <div key={i} className="mb-1">{error}</div>
                                    ))}
                                    {stats.errors.length > 5 && (
                                        <div className="text-xs mt-2">
                                            ... and {stats.errors.length - 5} more errors
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {status === 'completed' && (
                            <div className="bg-green-500/10 border border-green-500/20 p-4 rounded-lg flex items-center gap-3">
                                <CheckCircle className="text-green-600 dark:text-green-400" size={24} />
                                <div className="flex-1">
                                    <div className="font-bold text-green-700 dark:text-green-300">Upload Complete!</div>
                                    <div className="text-sm text-green-600/80 dark:text-green-400/80">
                                        {stats.success} new • {stats.skipped} already existed • {stats.failed} failed
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {status === 'error' && (
                    <div className="bg-destructive/10 border border-destructive/20 p-4 rounded-lg">
                        <div className="flex items-center gap-2">
                            <AlertCircle className="text-destructive" size={24} />
                            <div>
                                <div className="font-bold text-destructive">Upload Error</div>
                                <div className="text-sm text-destructive/80">
                                    An error occurred during upload. Please try again.
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};
