-- เพิ่มระยะเวลานำส่งสูงสุด (วัน) สำหรับสูตร safety stock
ALTER TABLE variantreorderparams
  ADD COLUMN IF NOT EXISTS maxleadtimedays INTEGER NOT NULL DEFAULT 7;
