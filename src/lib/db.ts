import { neon } from '@neondatabase/serverless';

export interface AttributionEvent {
    id: string;
    timestamp: string;
    ip: string | null;
    userAgent: string | null;
    headers: Record<string, string>;
    method: string;
    url: string;
}

export function getDb() {
    if (!process.env.DATABASE_URL) {
        throw new Error("DATABASE_URL is not defined in the environment.");
    }
    return neon(process.env.DATABASE_URL);
}

// Ensures the table is created
export async function initDb() {
    try {
        const sql = getDb();
        await sql`
            CREATE TABLE IF NOT EXISTS agent_attribution_logs (
                id UUID PRIMARY KEY,
                timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
                ip VARCHAR(255),
                user_agent TEXT,
                headers JSONB,
                method VARCHAR(16),
                url TEXT
            );
        `;
    } catch (e) {
        console.error("Failed to initialize database table:", e);
    }
}

export async function saveLogToDb(event: AttributionEvent) {
    const sql = getDb();
    await initDb(); // Ensure table exists for our demo

    await sql`
        INSERT INTO agent_attribution_logs (id, timestamp, ip, user_agent, headers, method, url)
        VALUES (
            ${event.id}, 
            ${event.timestamp}, 
            ${event.ip}, 
            ${event.userAgent}, 
            ${JSON.stringify(event.headers)}::jsonb, 
            ${event.method}, 
            ${event.url}
        )
    `;
}

export async function getLogsFromDb(): Promise<AttributionEvent[]> {
    const sql = getDb();
    await initDb();

    const rows = await sql`
        SELECT * FROM agent_attribution_logs
        ORDER BY timestamp DESC
        LIMIT 100;
    `;

    return rows.map((row) => ({
        id: row.id,
        timestamp: row.timestamp.toISOString(),
        ip: row.ip,
        userAgent: row.user_agent,
        headers: row.headers,
        method: row.method,
        url: row.url
    }));
}
