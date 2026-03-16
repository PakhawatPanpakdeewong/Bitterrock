/**
 * Unit tests for lib/parse.ts - ใช้ใน API (orders, reviews, categories, ...)
 * Report: report_parse_api.md
 */
import { safeParseInt, safeParseFloat } from '../parse';

describe('safeParseInt', () => {
  it('returns default for null/undefined/empty', () => {
    expect(safeParseInt(null, 0)).toBe(0);
    expect(safeParseInt(undefined, 42)).toBe(42);
    expect(safeParseInt('', 10)).toBe(10);
  });

  it('parses valid integer string', () => {
    expect(safeParseInt('123', 0)).toBe(123);
    expect(safeParseInt('-5', 0)).toBe(-5);
  });

  it('returns default for invalid string', () => {
    expect(safeParseInt('abc', 99)).toBe(99);
    expect(safeParseInt('12.34', 0)).toBe(12);
  });

  it('accepts radix', () => {
    expect(safeParseInt('10', 0, 2)).toBe(2);
  });
});

describe('safeParseFloat', () => {
  it('returns default for null/undefined/empty', () => {
    expect(safeParseFloat(null, 0)).toBe(0);
    expect(safeParseFloat(undefined, 1.5)).toBe(1.5);
    expect(safeParseFloat('', 0)).toBe(0);
  });

  it('parses valid float string', () => {
    expect(safeParseFloat('3.14', 0)).toBe(3.14);
    expect(safeParseFloat('-0.5', 0)).toBe(-0.5);
  });

  it('returns default for invalid string', () => {
    expect(safeParseFloat('x', 99)).toBe(99);
  });
});
