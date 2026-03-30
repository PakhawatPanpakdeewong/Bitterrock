import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import {
  getMiddlewareAction,
  isStaffRestrictedPath,
  STAFF_ROLE_COOKIE,
} from '@/lib/middleware-auth';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const session = request.cookies.get('session');
  const userId = request.cookies.get('userId');
  const action = getMiddlewareAction(pathname, !!session?.value, !!userId?.value);

  if (action.type === 'redirect') {
    return NextResponse.redirect(new URL(action.to, request.url));
  }

  if (
    isStaffRestrictedPath(pathname) &&
    session?.value &&
    userId?.value
  ) {
    let role = request.cookies.get(STAFF_ROLE_COOKIE)?.value?.toLowerCase() ?? null;
    if (!role) {
      try {
        const meRes = await fetch(`${request.nextUrl.origin}/api/auth/me`, {
          headers: { cookie: request.headers.get('cookie') ?? '' },
          cache: 'no-store',
        });
        const data = await meRes.json();
        role = data.ok ? String(data.user?.StaffRole ?? '').toLowerCase() : null;
      } catch {
        role = null;
      }
    }
    if (role === 'staff') {
      return NextResponse.redirect(new URL('/', request.url));
    }
    if (role && !request.cookies.get(STAFF_ROLE_COOKIE)?.value) {
      const res = NextResponse.next();
      res.cookies.set(STAFF_ROLE_COOKIE, role, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7,
        path: '/',
      });
      return res;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};

