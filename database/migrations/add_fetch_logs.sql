-- Migration: Add FetchLogs table for tracking failed fetch attempts
-- Admin-only page at /fetch-logs

CREATE TABLE IF NOT EXISTS FetchLogs (
    LogID SERIAL PRIMARY KEY,
    Source VARCHAR(100) NOT NULL,
    ResourceType VARCHAR(100) NOT NULL,
    ResourceId VARCHAR(255),
    ErrorMessage TEXT,
    HttpStatus INTEGER,
    CreatedAt TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_fetch_logs_source ON FetchLogs(Source);
CREATE INDEX IF NOT EXISTS idx_fetch_logs_created_at ON FetchLogs(CreatedAt DESC);
