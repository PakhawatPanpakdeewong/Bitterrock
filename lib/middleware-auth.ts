/**
 * Pure logic for auth middleware - ใช้โดย middleware.ts
 * แยกออกมาเพื่อ unit test ได้
 */

const PUBLIC_ROUTES = ['/login'] as const;

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
