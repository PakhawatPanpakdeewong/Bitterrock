import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getMiddlewareAction } from '@/lib/middleware-auth';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const session = request.cookies.get('session');
  const userId = request.cookies.get('userId');
  const action = getMiddlewareAction(pathname, !!session?.value, !!userId?.value);

  if (action.type === 'redirect') {
    return NextResponse.redirect(new URL(action.to, request.url));
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

