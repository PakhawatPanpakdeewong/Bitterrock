import { NextResponse } from 'next/server';
import { getCurrentUser, isStaff } from '@/lib/auth';

/** คืน NextResponse ถ้าไม่มีสิทธิ์; คืน null ถ้าผ่าน (ไม่ใช่ staff ธรรมดา) */
export async function forbidStaffApi(): Promise<NextResponse | null> {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }
  if (isStaff(user)) {
    return NextResponse.json(
      { ok: false, error: 'Forbidden: Staff cannot access this resource' },
      { status: 403 }
    );
  }
  return null;
}
