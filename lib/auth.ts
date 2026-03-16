import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';
import { query } from '@/database/db';

export interface StaffUser {
  StaffID: number;
  Username: string;
  Email: string;
  StaffRole: string;
  StaffStatus: string;
}

/** ใช้ตรวจสิทธิ์ admin (เช่น API fetch-logs, user-permissions) */
export function isAdmin(user: StaffUser): boolean {
  return user.StaffRole.toLowerCase() === 'admin';
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function getUserByUsernameOrEmail(usernameOrEmail: string): Promise<StaffUser | null> {
  try {
    const result = await query(
      'SELECT StaffID, Username, Email, PasswordHash, StaffRole, StaffStatus FROM StaffUsers WHERE Username = $1 OR Email = $1',
      [usernameOrEmail]
    );
    
    if (result.rows.length === 0) {
      return null;
    }
    
    const user = result.rows[0];
    return {
      StaffID: user.staffid,
      Username: user.username,
      Email: user.email,
      StaffRole: user.staffrole,
      StaffStatus: user.staffstatus,
    };
  } catch (error) {
    console.error('Error fetching user:', error);
    return null;
  }
}

export async function createSession(userId: number): Promise<string> {
  const sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  const cookieStore = await cookies();
  cookieStore.set('session', sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
  cookieStore.set('userId', userId.toString(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
  return sessionId;
}

export async function getCurrentUser(): Promise<StaffUser | null> {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get('userId')?.value;
    
    if (!userId) {
      return null;
    }
    
    const result = await query(
      'SELECT StaffID, Username, Email, StaffRole, StaffStatus FROM StaffUsers WHERE StaffID = $1 AND StaffStatus = $2',
      [userId, 'active']
    );
    
    if (result.rows.length === 0) {
      return null;
    }
    
    const user = result.rows[0];
    return {
      StaffID: user.staffid,
      Username: user.username,
      Email: user.email,
      StaffRole: user.staffrole,
      StaffStatus: user.staffstatus,
    };
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

export async function deleteSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete('session');
  cookieStore.delete('userId');
  // Force cookie deletion by setting empty values with past expiration
  cookieStore.set('session', '', { maxAge: 0 });
  cookieStore.set('userId', '', { maxAge: 0 });
}

export async function updateLastLogin(userId: number): Promise<void> {
  try {
    await query(
      'UPDATE StaffUsers SET LastLogin = CURRENT_TIMESTAMP WHERE StaffID = $1',
      [userId]
    );
  } catch (error) {
    console.error('Error updating last login:', error);
  }
}

