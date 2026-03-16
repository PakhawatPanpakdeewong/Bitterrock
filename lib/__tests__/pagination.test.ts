/**
 * Unit tests for lib/pagination.ts - ใช้โดย API หลายตัว (fetch-logs, orders, discounts, ...)
 * Report: report_pagination_api.md
 */
import { parseLimitOffset } from '../pagination';

describe('parseLimitOffset', () => {
  it('uses defaults when params are null/undefined', () => {
    expect(parseLimitOffset(null, null)).toEqual({ limit: 50, offset: 0 });
    expect(parseLimitOffset(undefined, undefined)).toEqual({ limit: 50, offset: 0 });
  });

  it('clamps limit between 1 and maxLimit', () => {
    expect(parseLimitOffset('10', '0')).toEqual({ limit: 10, offset: 0 });
    expect(parseLimitOffset('200', '0', { maxLimit: 100 })).toEqual({ limit: 100, offset: 0 });
    expect(parseLimitOffset('0', '0')).toEqual({ limit: 1, offset: 0 });
    expect(parseLimitOffset('-5', '0')).toEqual({ limit: 1, offset: 0 });
  });

  it('clamps offset to >= 0', () => {
    expect(parseLimitOffset('50', '-1')).toEqual({ limit: 50, offset: 0 });
    expect(parseLimitOffset('50', '100')).toEqual({ limit: 50, offset: 100 });
  });

  it('accepts custom options', () => {
    expect(
      parseLimitOffset(null, null, { maxLimit: 500, defaultLimit: 100, defaultOffset: 10 })
    ).toEqual({ limit: 100, offset: 10 });
    expect(parseLimitOffset('999', '5', { maxLimit: 500 })).toEqual({ limit: 500, offset: 5 });
  });

  it('handles NaN from invalid string', () => {
    expect(parseLimitOffset('abc', 'x')).toEqual({ limit: 50, offset: 0 });
  });

  it('empty string uses defaults', () => {
    expect(parseLimitOffset('', '')).toEqual({ limit: 50, offset: 0 });
  });
});
