import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { ok: false, error: 'ไม่พบข้อมูลผู้ใช้' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      ok: true,
      user: {
        StaffID: user.StaffID,
        Username: user.Username,
        Email: user.Email,
        StaffRole: user.StaffRole,
      },
    });
  } catch (error) {
    console.error('Get current user error:', error);
    return NextResponse.json(
      { ok: false, error: 'เกิดข้อผิดพลาดในการดึงข้อมูลผู้ใช้' },
      { status: 500 }
    );
  }
}

