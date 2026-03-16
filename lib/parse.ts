/**
 * Parse helpers สำหรับ query/body - ใช้ใน API หลายตัว
 */

/**
 * แปลงสตริงเป็น integer คืน default เมื่อไม่ใช่ตัวเลข
 */
export function safeParseInt(
  value: string | null | undefined,
  defaultValue: number,
  radix = 10
): number {
  if (value == null || value === '') return defaultValue;
  const n = parseInt(value, radix);
  return Number.isNaN(n) ? defaultValue : n;
}

/**
 * แปลงสตริงเป็น float คืน default เมื่อไม่ใช่ตัวเลข
 */
export function safeParseFloat(
  value: string | null | undefined,
  defaultValue: number
): number {
  if (value == null || value === '') return defaultValue;
  const n = parseFloat(value);
  return Number.isNaN(n) ? defaultValue : n;
}
