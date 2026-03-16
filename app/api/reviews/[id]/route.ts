import { NextRequest, NextResponse } from 'next/server';
import { query } from '../../../../database/connection';
import { getCurrentUser } from '@/lib/auth';
import { logStaffActivity } from '@/database/activity-log';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const reviewId = parseInt(id, 10);
    if (isNaN(reviewId)) {
      return NextResponse.json({ ok: false, error: 'รหัสรีวิวไม่ถูกต้อง' }, { status: 400 });
    }

    const body = await req.json();
    const { is_approved } = body;

    if (typeof is_approved !== 'boolean') {
      return NextResponse.json(
        { ok: false, error: 'ต้องระบุ is_approved (true/false)' },
        { status: 400 }
      );
    }

    const res = await query(
      `UPDATE reviews 
       SET isapproved = $1 
       WHERE reviewid = $2 
       RETURNING reviewid, isapproved`,
      [is_approved, reviewId]
    );

    if (res.rowCount === 0) {
      return NextResponse.json({ ok: false, error: 'ไม่พบรีวิว' }, { status: 404 });
    }

    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || null;
    await logStaffActivity({
      user,
      actionType: 'review_moderation',
      resourceType: 'review',
      resourceId: reviewId,
      ipAddress: ip,
      details: {
        is_approved,
      },
    });

    return NextResponse.json({
      ok: true,
      review_id: reviewId,
      is_approved,
    });
  } catch (error) {
    console.error('Error updating review:', error);
    return NextResponse.json(
      { ok: false, error: 'ไม่สามารถอัปเดตรีวิวได้' },
      { status: 500 }
    );
  }
}
