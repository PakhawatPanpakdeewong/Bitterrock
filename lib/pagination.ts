/**
 * Parse limit/offset จาก query string - ใช้โดย API หลายตัว
 */
export interface ParseLimitOffsetOptions {
  maxLimit?: number;
  defaultLimit?: number;
  defaultOffset?: number;
}

const DEFAULT_OPTIONS: Required<ParseLimitOffsetOptions> = {
  maxLimit: 100,
  defaultLimit: 50,
  defaultOffset: 0,
};

/**
 * แปลง limit, offset จาก string เป็น number ที่อยู่ในช่วงที่กำหนด
 * คืนค่า { limit, offset } ที่ปลอดภัยสำหรับใช้ใน SQL
 */
export function parseLimitOffset(
  limitParam: string | null | undefined,
  offsetParam: string | null | undefined,
  options: ParseLimitOffsetOptions = {}
): { limit: number; offset: number } {
  const { maxLimit, defaultLimit, defaultOffset } = { ...DEFAULT_OPTIONS, ...options };
  const rawLimit = limitParam != null && limitParam !== '' ? Number(limitParam) : defaultLimit;
  const rawOffset = offsetParam != null && offsetParam !== '' ? Number(offsetParam) : defaultOffset;
  const limit = Math.min(maxLimit, Math.max(1, Number.isNaN(rawLimit) ? defaultLimit : rawLimit));
  const offset = Math.max(0, Number.isNaN(rawOffset) ? defaultOffset : rawOffset);
  return { limit, offset };
}
