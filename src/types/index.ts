export interface Brand {
    id: string;
    name: string;
}

export interface SendyList {
    id: string;
    name: string;
}

export interface SendyConfig {
    apiKey: string;
    url: string;
}

export interface UploadStats {
    total: number;
    success: number;
    failed: number;
    errors: Array<{ email: string; error: string }>;
    timestamp: string;
    fileName: string;
    listName: string;
}
