/**
 * Unit tests for lib/format.ts - หน้าที่เกี่ยวข้อง: Home, Inventory, Orders, Fetch-logs, etc.
 * Report: report_format_home.md, report_format_inventory.md
 */
import { formatCurrency, formatDate } from '../format';

describe('formatCurrency (Home page)', () => {
  it('formats number with 2 decimal places', () => {
    const a = formatCurrency(100);
    const b = formatCurrency(0);
    expect(a).toMatch(/100[.,]00/);
    expect(b).toMatch(/0[.,]00/);
  });

  it('returns string with digits', () => {
    const result = formatCurrency(1234.5);
    expect(typeof result).toBe('string');
    expect(result).toMatch(/\d/);
  });

  it('rounds to 2 decimal places', () => {
    const r1 = formatCurrency(99.999);
    const r2 = formatCurrency(10.126);
    expect(r1).toMatch(/100[.,]00/);
    expect(r2).toMatch(/10[.,]13/);
  });

  it('handles large numbers', () => {
    const result = formatCurrency(1_000_000.5);
    expect(result).toMatch(/\d/);
    expect(result.length).toBeGreaterThan(5);
  });
});

describe('formatDate (Inventory, Orders, Fetch-logs, etc.)', () => {
  it('returns N/A for null or empty', () => {
    expect(formatDate(null)).toBe('N/A');
    expect(formatDate(undefined)).toBe('N/A');
    expect(formatDate('')).toBe('N/A');
  });

  it('returns formatted string for valid ISO date', () => {
    const result = formatDate('2024-06-15T10:30:00.000Z');
    expect(result).not.toBe('N/A');
    expect(result).toMatch(/\d/);
  });

  it('returns N/A for invalid date string', () => {
    expect(formatDate('not-a-date')).toBe('N/A');
    expect(formatDate('invalid')).toBe('N/A');
  });
});
