import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const session = request.cookies.get('session');
  const userId = request.cookies.get('userId');

  // Public routes that don't require authentication
  const publicRoutes = ['/login'];
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));

  // If user is on login page and already authenticated, redirect to home
  if (pathname === '/login' && session && userId) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // If user is trying to access protected route without session, redirect to login
  if (!isPublicRoute && (!session || !userId)) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Block staff from accessing user-permissions page
  if (pathname === '/user-permissions' && session && userId) {
    // We need to check the user role, but middleware can't easily access database
    // So we'll handle this in the page component instead
    // This is a basic check - full role check will be in the page
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

