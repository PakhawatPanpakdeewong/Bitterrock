/**
 * Unit tests for lib/auth - หน้าที่เกี่ยวข้อง: Login (app/login, app/api/auth/login)
 * Report: report_auth_login.md
 */
import {
  verifyPassword,
  hashPassword,
  getUserByUsernameOrEmail,
  createSession,
  getCurrentUser,
  deleteSession,
  updateLastLogin,
  isAdmin,
} from '../auth';

jest.mock('next/headers', () => ({
  cookies: jest.fn(),
}));

jest.mock('@/database/db', () => ({
  query: jest.fn(),
}));

const { cookies } = require('next/headers');
const { query } = require('@/database/db');

describe('isAdmin', () => {
  it('returns true when StaffRole is admin (case insensitive)', () => {
    expect(isAdmin({ StaffID: 1, Username: 'a', Email: 'a@x.com', StaffRole: 'admin', StaffStatus: 'active' })).toBe(true);
    expect(isAdmin({ StaffID: 1, Username: 'a', Email: 'a@x.com', StaffRole: 'Admin', StaffStatus: 'active' })).toBe(true);
    expect(isAdmin({ StaffID: 1, Username: 'a', Email: 'a@x.com', StaffRole: 'ADMIN', StaffStatus: 'active' })).toBe(true);
  });

  it('returns false when StaffRole is not admin', () => {
    expect(isAdmin({ StaffID: 1, Username: 'a', Email: 'a@x.com', StaffRole: 'staff', StaffStatus: 'active' })).toBe(false);
    expect(isAdmin({ StaffID: 1, Username: 'a', Email: 'a@x.com', StaffRole: '', StaffStatus: 'active' })).toBe(false);
  });
});

describe('verifyPassword', () => {
  it('returns true when password matches hash', async () => {
    const password = 'testpass123';
    const hash = await hashPassword(password);
    const result = await verifyPassword(password, hash);
    expect(result).toBe(true);
  });

  it('returns false when password does not match hash', async () => {
    const hash = await hashPassword('correct');
    const result = await verifyPassword('wrong', hash);
    expect(result).toBe(false);
  });

  it('returns false for empty password with valid hash', async () => {
    const hash = await hashPassword('something');
    const result = await verifyPassword('', hash);
    expect(result).toBe(false);
  });
});

describe('hashPassword', () => {
  it('returns a non-empty string', async () => {
    const hash = await hashPassword('mypassword');
    expect(typeof hash).toBe('string');
    expect(hash.length).toBeGreaterThan(0);
  });

  it('returns different hash each time (salt)', async () => {
    const h1 = await hashPassword('same');
    const h2 = await hashPassword('same');
    expect(h1).not.toBe(h2);
  });

  it('hash can be verified with verifyPassword', async () => {
    const p = 'secret';
    const hash = await hashPassword(p);
    expect(await verifyPassword(p, hash)).toBe(true);
  });
});

describe('getUserByUsernameOrEmail', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns null when no rows', async () => {
    (query as jest.Mock).mockResolvedValue({ rows: [] });
    const result = await getUserByUsernameOrEmail('nobody');
    expect(result).toBeNull();
    expect(query).toHaveBeenCalledWith(
      expect.stringContaining('Username = $1 OR Email = $1'),
      ['nobody']
    );
  });

  it('returns StaffUser when user exists', async () => {
    (query as jest.Mock).mockResolvedValue({
      rows: [
        {
          staffid: 1,
          username: 'admin',
          email: 'admin@test.com',
          staffrole: 'admin',
          staffstatus: 'active',
        },
      ],
    });
    const result = await getUserByUsernameOrEmail('admin');
    expect(result).toEqual({
      StaffID: 1,
      Username: 'admin',
      Email: 'admin@test.com',
      StaffRole: 'admin',
      StaffStatus: 'active',
    });
  });

  it('returns null on query error', async () => {
    (query as jest.Mock).mockRejectedValue(new Error('DB error'));
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    const result = await getUserByUsernameOrEmail('x');
    expect(result).toBeNull();
    consoleSpy.mockRestore();
  });
});

describe('createSession', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (cookies as jest.Mock).mockResolvedValue({
      set: jest.fn(),
      get: jest.fn(),
      delete: jest.fn(),
    });
  });

  it('returns session id in expected format', async () => {
    const sessionId = await createSession(42);
    expect(sessionId).toMatch(/^session_\d+_[a-z0-9]+$/);
  });

  it('calls cookie set with userId', async () => {
    const mockSet = jest.fn();
    (cookies as jest.Mock).mockResolvedValue({
      set: mockSet,
      get: jest.fn(),
      delete: jest.fn(),
    });
    await createSession(99);
    expect(mockSet).toHaveBeenCalledWith('userId', '99', expect.any(Object));
  });
});

describe('getCurrentUser', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (cookies as jest.Mock).mockResolvedValue({
      set: jest.fn(),
      get: jest.fn(),
      delete: jest.fn(),
    });
  });

  it('returns null when no userId cookie', async () => {
    (cookies as jest.Mock).mockResolvedValue({ get: () => undefined });
    const result = await getCurrentUser();
    expect(result).toBeNull();
    expect(query).not.toHaveBeenCalled();
  });

  it('returns StaffUser when userId exists and DB has active user', async () => {
    (cookies as jest.Mock).mockResolvedValue({
      get: (name: string) => (name === 'userId' ? { value: '10' } : undefined),
    });
    (query as jest.Mock).mockResolvedValue({
      rows: [
        {
          staffid: 10,
          username: 'staff',
          email: 's@x.com',
          staffrole: 'staff',
          staffstatus: 'active',
        },
      ],
    });
    const result = await getCurrentUser();
    expect(result).toEqual({
      StaffID: 10,
      Username: 'staff',
      Email: 's@x.com',
      StaffRole: 'staff',
      StaffStatus: 'active',
    });
    expect(query).toHaveBeenCalledWith(
      expect.stringContaining('StaffID = $1 AND StaffStatus = $2'),
      ['10', 'active']
    );
  });

  it('returns null when DB returns no rows', async () => {
    (cookies as jest.Mock).mockResolvedValue({
      get: (name: string) => (name === 'userId' ? { value: '999' } : undefined),
    });
    (query as jest.Mock).mockResolvedValue({ rows: [] });
    const result = await getCurrentUser();
    expect(result).toBeNull();
  });

  it('returns null on query error', async () => {
    (cookies as jest.Mock).mockResolvedValue({
      get: (name: string) => (name === 'userId' ? { value: '1' } : undefined),
    });
    (query as jest.Mock).mockRejectedValue(new Error('DB error'));
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    const result = await getCurrentUser();
    expect(result).toBeNull();
    consoleSpy.mockRestore();
  });
});

describe('deleteSession', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    const mockDelete = jest.fn();
    const mockSet = jest.fn();
    (cookies as jest.Mock).mockResolvedValue({
      set: mockSet,
      get: jest.fn(),
      delete: mockDelete,
    });
  });

  it('calls cookie delete and set with maxAge 0', async () => {
    const mockDelete = jest.fn();
    const mockSet = jest.fn();
    (cookies as jest.Mock).mockResolvedValue({
      set: mockSet,
      get: jest.fn(),
      delete: mockDelete,
    });
    await deleteSession();
    expect(mockDelete).toHaveBeenCalledWith('session');
    expect(mockDelete).toHaveBeenCalledWith('userId');
    expect(mockSet).toHaveBeenCalledWith('session', '', { maxAge: 0 });
    expect(mockSet).toHaveBeenCalledWith('userId', '', { maxAge: 0 });
  });
});

describe('updateLastLogin', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('calls query with StaffID', async () => {
    (query as jest.Mock).mockResolvedValue(undefined);
    await updateLastLogin(5);
    expect(query).toHaveBeenCalledWith(
      expect.stringContaining('LastLogin'),
      [5]
    );
  });

  it('does not throw when query fails', async () => {
    (query as jest.Mock).mockRejectedValue(new Error('DB error'));
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    await expect(updateLastLogin(1)).resolves.not.toThrow();
    consoleSpy.mockRestore();
  });
});
