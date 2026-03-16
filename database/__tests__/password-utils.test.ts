/**
 * Unit tests for database/password-utils.ts - ใช้โดย hash-passwords script
 * Report: report_password-utils_hash-passwords.md
 */
import { isBcryptHash } from '../password-utils';

describe('isBcryptHash', () => {
  it('returns true for $2a$ prefix', () => {
    expect(isBcryptHash('$2a$10$abcdef')).toBe(true);
  });

  it('returns true for $2b$ prefix', () => {
    expect(isBcryptHash('$2b$12$x')).toBe(true);
  });

  it('returns true for $2y$ prefix', () => {
    expect(isBcryptHash('$2y$10$fullhash')).toBe(true);
  });

  it('returns false for plain password', () => {
    expect(isBcryptHash('mypassword')).toBe(false);
    expect(isBcryptHash('')).toBe(false);
  });

  it('returns false for null or undefined', () => {
    expect(isBcryptHash(null)).toBe(false);
    expect(isBcryptHash(undefined)).toBe(false);
  });

  it('returns false for similar but invalid prefix', () => {
    expect(isBcryptHash('$2c$10$x')).toBe(false);
    expect(isBcryptHash('2a$10$x')).toBe(false);
  });
});
