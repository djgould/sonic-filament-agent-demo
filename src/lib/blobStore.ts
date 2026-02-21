import { list, put } from "@vercel/blob";
import fs from "fs/promises";
import path from "path";

export interface AttributionEvent {
    id: string;
    timestamp: string;
    ip: string | null;
    userAgent: string | null;
    headers: Record<string, string>;
    method: string;
    url: string;
}

const BLOB_FILENAME = "logs.json";
const LOCAL_FS_PATH = path.join(process.cwd(), "logs.json");

export async function getLogsFromBlob(): Promise<AttributionEvent[]> {
    try {
        if (!process.env.BLOB_READ_WRITE_TOKEN) {
            // Fallback to local FS only in development
            if (process.env.NODE_ENV === "development") {
                try {
                    const data = await fs.readFile(LOCAL_FS_PATH, "utf-8");
                    return JSON.parse(data);
                } catch (e) {
                    return [];
                }
            } else {
                console.warn("BLOB_READ_WRITE_TOKEN missing in production. Returning empty logs.");
                return [];
            }
        }

        const { blobs } = await list({ prefix: BLOB_FILENAME });
        if (blobs.length === 0) return [];

        // Sort to get newest
        blobs.sort((a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime());

        const targetUrl = blobs[0].downloadUrl || blobs[0].url;
        const res = await fetch(targetUrl, { cache: "no-store" });
        if (!res.ok) {
            console.error("Failed to fetch blob contents:", res.statusText);
            return [];
        }

        return await res.json();
    } catch (e) {
        console.error("Failed to read from blob:", e);
        // Throw the error so the API route can handle it and we don't silently fail
        throw e;
    }
}

export async function saveLogToBlob(event: AttributionEvent) {
    try {
        const currentLogs = await getLogsFromBlob();
        const updatedLogs = [event, ...currentLogs].slice(0, 100);

        if (!process.env.BLOB_READ_WRITE_TOKEN) {
            if (process.env.NODE_ENV === "development") {
                // Fallback to local FS
                await fs.writeFile(LOCAL_FS_PATH, JSON.stringify(updatedLogs, null, 2));
            } else {
                console.warn("BLOB_READ_WRITE_TOKEN missing in production. Skipping log save.");
            }
            return;
        }

        await put(BLOB_FILENAME, JSON.stringify(updatedLogs), {
            access: "private",
            addRandomSuffix: false,
            allowOverwrite: true
        });
    } catch (e) {
        console.error("Failed to write to blob", e);
        // Throw so we know it failed
        throw e;
    }
}
