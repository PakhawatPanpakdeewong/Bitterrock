import { query } from '@/database/connection';

export interface FetchLogEntry {
  source: string;
  resourceType: string;
  resourceId?: string;
  errorMessage?: string;
  httpStatus?: number;
}

/**
 * Log a failed fetch attempt. Fails silently if DB is unavailable.
 */
export async function logFetchFailure(entry: FetchLogEntry): Promise<void> {
  try {
    await query(
      `INSERT INTO fetchlogs (source, resourcetype, resourceid, errormessage, httpstatus)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        entry.source,
        entry.resourceType,
        entry.resourceId ?? null,
        entry.errorMessage ?? null,
        entry.httpStatus ?? null,
      ]
    );
  } catch (err) {
    console.error('Failed to log fetch error:', err);
  }
}
