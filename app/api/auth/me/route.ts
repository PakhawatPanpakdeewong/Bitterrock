import { NextResponse } from 'next/server';
import { getCurrentUser, getStaffRoleCookieOptions, STAFF_ROLE_COOKIE_NAME } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { ok: false, error: 'ไม่พบข้อมูลผู้ใช้' },
        { status: 401 }
      );
    }

    const res = NextResponse.json({
      ok: true,
      user: {
        StaffID: user.StaffID,
        Username: user.Username,
        Email: user.Email,
        StaffRole: user.StaffRole,
      },
    });
    res.cookies.set(STAFF_ROLE_COOKIE_NAME, user.StaffRole.toLowerCase(), getStaffRoleCookieOptions());
    return res;
  } catch (error) {
    console.error('Get current user error:', error);
    return NextResponse.json(
      { ok: false, error: 'เกิดข้อผิดพลาดในการดึงข้อมูลผู้ใช้' },
      { status: 500 }
    );
  }
}

