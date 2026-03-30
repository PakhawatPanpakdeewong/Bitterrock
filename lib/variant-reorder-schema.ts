import { query } from '@/database/connection';

/** Cache per process — คอลัมน์ไม่หายระหว่างรัน */
let cachedHasMaxLeadTime: boolean | null = null;

/** มีคอลัมน์ maxleadtimedays (หลังรัน migration) หรือไม่ */
export async function hasVariantReorderMaxLeadColumn(): Promise<boolean> {
  if (cachedHasMaxLeadTime !== null) return cachedHasMaxLeadTime;
  try {
    const r = await query(
      `SELECT 1 FROM information_schema.columns
       WHERE table_schema = current_schema()
         AND table_name = 'variantreorderparams'
         AND column_name = 'maxleadtimedays'
       LIMIT 1`
    );
    cachedHasMaxLeadTime = r.rows.length > 0;
  } catch {
    cachedHasMaxLeadTime = false;
  }
  return cachedHasMaxLeadTime;
}
