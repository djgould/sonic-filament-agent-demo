import { neon } from '@neondatabase/serverless';

export interface AttributionEvent {
    id: string;
    timestamp: string;
    ip: string | null;
    userAgent: string | null;
    headers: Record<string, string>;
    method: string;
    url: string;
    label?: string | null;
}

export function getDbString() {
    if (!process.env.DATABASE_URL) {
        throw new Error("DATABASE_URL is not defined in the environment.");
    }
    return process.env.DATABASE_URL;
}

export async function query(text: string, params: any[] = []) {
    const dbUrl = getDbString();

    // As of recent @neondatabase/serverless versions, you must use sql.query for string-based parameterized DB inserts
    // e.g sql.query("INSERT INTO foo (id) VALUES ($1)", [1]) rather than sql("INSERT INTO foo... ", [1])
    const sql = neon(dbUrl);

    // Typecast to bypass TS not perfectly exposing query on neon tagged template instances in all environments
    return await (sql as any).query(text, params);
}

// Ensures the table is created
export async function initDb() {
    try {
        await query(`
            CREATE TABLE IF NOT EXISTS agent_attribution_logs (
                id UUID PRIMARY KEY,
                timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
                ip VARCHAR(255),
                user_agent TEXT,
                headers JSONB,
                method VARCHAR(16),
                url TEXT,
                label VARCHAR(255)
            );
        `);
    } catch (e) {
        console.error("Failed to initialize database table:", e);
    }
}

export async function saveLogToDb(event: AttributionEvent) {
    await initDb(); // Ensure table exists for our demo

    await query(`
        INSERT INTO agent_attribution_logs (id, timestamp, ip, user_agent, headers, method, url)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [
        event.id,
        event.timestamp,
        event.ip,
        event.userAgent,
        event.headers,
        event.method,
        event.url
    ]);
}

export async function getLogsFromDb(): Promise<AttributionEvent[]> {
    await initDb();

    const result = await query(`
        SELECT * FROM agent_attribution_logs
        ORDER BY timestamp DESC
        LIMIT 100;
    `);

    // Ensure we handle date formatting robustly
    return result.rows.map((row: any) => ({
        id: row.id,
        timestamp: typeof row.timestamp === 'string' ? new Date(row.timestamp).toISOString() : row.timestamp.toISOString(),
        ip: row.ip,
        userAgent: row.user_agent,
        headers: row.headers,
        method: row.method,
        url: row.url,
        label: row.label
    }));
}
