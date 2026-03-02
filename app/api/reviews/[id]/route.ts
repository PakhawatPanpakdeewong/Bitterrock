import { NextRequest, NextResponse } from 'next/server';
import { query } from '../../../../database/connection';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
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
