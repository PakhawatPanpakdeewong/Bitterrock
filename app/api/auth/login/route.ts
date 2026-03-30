import { NextRequest, NextResponse } from 'next/server';
import { getUserByUsernameOrEmail, verifyPassword, createSession, updateLastLogin } from '@/lib/auth';
import { query } from '@/database/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { usernameOrEmail, password } = body;

    // Validate input
    if (!usernameOrEmail || !password) {
      return NextResponse.json(
        { ok: false, error: 'กรุณากรอกชื่อผู้ใช้หรืออีเมลล์และรหัสผ่าน' },
        { status: 400 }
      );
    }

    // Get user with password hash from database
    const result = await query(
      'SELECT StaffID, Username, Email, PasswordHash, StaffRole, StaffStatus FROM StaffUsers WHERE (Username = $1 OR Email = $1)',
      [usernameOrEmail]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { ok: false, error: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' },
        { status: 401 }
      );
    }

    const dbUser = result.rows[0];
    const passwordHash = dbUser.passwordhash;

    // Check if user is active
    if (dbUser.staffstatus !== 'active') {
      return NextResponse.json(
        { ok: false, error: 'บัญชีผู้ใช้นี้ถูกปิดการใช้งาน' },
        { status: 403 }
      );
    }

    // Verify password
    const isValidPassword = await verifyPassword(password, passwordHash);
    
    if (!isValidPassword) {
      return NextResponse.json(
        { ok: false, error: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' },
        { status: 401 }
      );
    }

    // Create session
    await createSession(dbUser.staffid, dbUser.staffrole);
    
    // Update last login
    await updateLastLogin(dbUser.staffid);

    return NextResponse.json({
      ok: true,
      user: {
        StaffID: dbUser.staffid,
        Username: dbUser.username,
        Email: dbUser.email,
        StaffRole: dbUser.staffrole,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { ok: false, error: 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ' },
      { status: 500 }
    );
  }
}

