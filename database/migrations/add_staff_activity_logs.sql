-- Staff activity logs: บันทึกว่า Staff คนไหนทำอะไร ที่ resource ไหน เมื่อไร
CREATE TABLE IF NOT EXISTS staff_activity_logs (
  log_id SERIAL PRIMARY KEY,
  staff_id INTEGER,
  username TEXT,
  action_type TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT,
  details JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_staff_activity_logs_staff_id
  ON staff_activity_logs (staff_id);

CREATE INDEX IF NOT EXISTS idx_staff_activity_logs_resource
  ON staff_activity_logs (resource_type, resource_id);

CREATE INDEX IF NOT EXISTS idx_staff_activity_logs_created_at
  ON staff_activity_logs (created_at DESC);

