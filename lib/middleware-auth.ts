/**
 * Pure logic for auth middleware - ใช้โดย middleware.ts
 * แยกออกมาเพื่อ unit test ได้
 */

const PUBLIC_ROUTES = ['/login'] as const;

/** หน้าที่บทบาท staff ธรรมดาเข้าไม่ได้ */
export const STAFF_RESTRICTED_PREFIXES = [
  '/promotions',
  '/sales-summary',
  '/warehouse-stock',
  '/reorder',
  '/user-permissions',
  '/fetch-logs',
] as const;

export function isStaffRestrictedPath(pathname: string): boolean {
  return STAFF_RESTRICTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

/** ต้องตรงกับ lib/auth STAFF_ROLE_COOKIE_NAME (ไม่ import auth ใน middleware เพื่อลด bundle) */
export const STAFF_ROLE_COOKIE = 'staffRole';

export type MiddlewareAction =
  | { type: 'redirect'; to: '/login' | '/' }
  | { type: 'next' };

/**
 * คิดว่าจะ redirect ไปไหน หรือ next ตาม pathname และ session
 */
export function getMiddlewareAction(
  pathname: string,
  hasSession: boolean,
  hasUserId: boolean
): MiddlewareAction {
  const isPublicRoute = PUBLIC_ROUTES.some((route) => pathname.startsWith(route));

  if (pathname === '/login' && hasSession && hasUserId) {
    return { type: 'redirect', to: '/' };
  }

  if (!isPublicRoute && (!hasSession || !hasUserId)) {
    return { type: 'redirect', to: '/login' };
  }

  return { type: 'next' };
}
