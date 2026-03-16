/**
 * Password helpers - ใช้โดย database/hash-passwords.ts
 * แยกออกมาเพื่อ unit test ได้
 */
export function isBcryptHash(value: string | null | undefined): boolean {
  if (!value || typeof value !== 'string') return false;
  return (
    value.startsWith('$2a$') ||
    value.startsWith('$2b$') ||
    value.startsWith('$2y$')
  );
}
