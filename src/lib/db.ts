import mysql from 'mysql2/promise';

let pool: mysql.Pool | null = null;

function getEnv(name: string): string | undefined {
    return process.env[name];
}

/**
 * Returns a MySQL connection pool for the Sendy database when
 * SENDY_DB_HOST, SENDY_DB_USER, SENDY_DB_PASSWORD, SENDY_DB_NAME are set.
 * Otherwise returns null (use mock data).
 */
export async function getPool(): Promise<mysql.Pool | null> {
    const host = getEnv('SENDY_DB_HOST');
    const user = getEnv('SENDY_DB_USER');
    const password = getEnv('SENDY_DB_PASSWORD');
    const database = getEnv('SENDY_DB_NAME');

    if (!host || !user || !database) {
        return null;
    }

    if (pool) {
        return pool;
    }

    pool = mysql.createPool({
        host,
        user,
        password: password || undefined,
        database,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
    });

    return pool;
}

export function getTablePrefix(): string {
    return getEnv('SENDY_DB_TABLE_PREFIX') || '';
}

/** campaigns.to_send or recipients column name */
export function getRecipientColumn(): string {
    return getEnv('SENDY_DB_RECIPIENT_COLUMN') || 'to_send';
}
