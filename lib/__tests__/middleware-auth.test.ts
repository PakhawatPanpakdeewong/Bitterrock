/**
 * Unit tests for lib/middleware-auth.ts - หน้าที่เกี่ยวข้อง: Middleware (ทุกหน้าที่ต้อง login)
 * Report: report_middleware-auth_middleware.md
 */
import { getMiddlewareAction } from '../middleware-auth';

describe('getMiddlewareAction', () => {
  it('redirects to / when on /login with session and userId', () => {
    expect(getMiddlewareAction('/login', true, true)).toEqual({
      type: 'redirect',
      to: '/',
    });
  });

  it('next when on /login without session', () => {
    expect(getMiddlewareAction('/login', false, false)).toEqual({ type: 'next' });
    expect(getMiddlewareAction('/login', true, false)).toEqual({ type: 'next' });
    expect(getMiddlewareAction('/login', false, true)).toEqual({ type: 'next' });
  });

  it('redirects to /login when protected route and no session', () => {
    expect(getMiddlewareAction('/', false, false)).toEqual({
      type: 'redirect',
      to: '/login',
    });
    expect(getMiddlewareAction('/orders', false, true)).toEqual({
      type: 'redirect',
      to: '/login',
    });
    expect(getMiddlewareAction('/products', true, false)).toEqual({
      type: 'redirect',
      to: '/login',
    });
  });

  it('next when protected route with session and userId', () => {
    expect(getMiddlewareAction('/', true, true)).toEqual({ type: 'next' });
    expect(getMiddlewareAction('/orders', true, true)).toEqual({ type: 'next' });
    expect(getMiddlewareAction('/user-permissions', true, true)).toEqual({
      type: 'next',
    });
  });

  it('treats /login/xxx as public', () => {
    expect(getMiddlewareAction('/login/forgot', false, false)).toEqual({
      type: 'next',
    });
  });
});
