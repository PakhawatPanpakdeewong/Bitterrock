/**
 * Unit tests for cn() - class name utility used across all pages
 * Report: report_cn_utils.md
 */
import { cn } from '../cn';

describe('cn (class name merge utility)', () => {
  it('returns empty string when no arguments', () => {
    expect(cn()).toBe('');
  });

  it('merges single string', () => {
    expect(cn('foo')).toBe('foo');
  });

  it('merges multiple strings', () => {
    expect(cn('foo', 'bar')).toBe('foo bar');
  });

  it('ignores falsy values', () => {
    expect(cn('foo', undefined, 'bar', null, false, 'baz')).toBe('foo bar baz');
  });

  it('handles conditional classes with tailwind-merge (later wins)', () => {
    // twMerge: conflicting Tailwind classes - last one wins
    expect(cn('p-4', 'p-2')).toBe('p-2');
  });

  it('handles arrays', () => {
    expect(cn(['foo', 'bar'])).toBe('foo bar');
  });

  it('handles object with conditional classes', () => {
    expect(cn('base', { active: true, disabled: false })).toBe('base active');
  });

  it('handles mixed inputs', () => {
    expect(cn('a', undefined, ['b', 'c'], { d: true })).toBe('a b c d');
  });
});
