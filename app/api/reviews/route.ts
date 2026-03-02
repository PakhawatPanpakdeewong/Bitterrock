import { NextRequest, NextResponse } from 'next/server';
import { query } from '../../../database/connection';

type DbReview = {
  review_id: number;
  product_id: number;
  variant_id: number | null;
  customer_id: number;
  rating: number;
  review_text: string | null;
  review_date: string;
  is_approved: boolean;
  product_name_th: string;
  product_name_en: string;
  customer_first_name: string;
  customer_last_name: string;
  customer_email: string;
};

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit') || 50)));
    const offset = Math.max(0, Number(searchParams.get('offset') || 0));
    const status = searchParams.get('status'); // 'all' | 'pending' | 'approved'
    const search = searchParams.get('search');

    const params: any[] = [];
    const whereConditions: string[] = [];

    if (status && status !== 'all') {
      if (status === 'pending') {
        whereConditions.push('r.isapproved = false');
      } else if (status === 'approved') {
        whereConditions.push('r.isapproved = true');
      }
    }

    if (search) {
      whereConditions.push(
        `(p.productnameth ILIKE $${params.length + 1} OR p.productnameen ILIKE $${params.length + 1} OR c.email ILIKE $${params.length + 1} OR r.reviewtext ILIKE $${params.length + 1})`
      );
      params.push(`%${search}%`);
    }

    const whereSql = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
    params.push(limit, offset);

    const reviewsRes = await query(
      `SELECT 
        r.reviewid as review_id,
        r.productid as product_id,
        r.variantid as variant_id,
        r.customerid as customer_id,
        r.rating,
        r.reviewtext as review_text,
        r.reviewdate::text as review_date,
        r.isapproved as is_approved,
        p.productnameth as product_name_th,
        p.productnameen as product_name_en,
        c.firstname as customer_first_name,
        c.lastname as customer_last_name,
        c.email as customer_email
      FROM reviews r
      JOIN products p ON p.productid = r.productid
      JOIN customers c ON c.customerid = r.customerid
      ${whereSql}
      ORDER BY r.reviewdate DESC, r.reviewid DESC
      LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    const reviews = reviewsRes.rows as unknown as DbReview[];

    // Get stats
    const statsRes = await query(
      `SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE isapproved = false) as pending,
        COUNT(*) FILTER (WHERE isapproved = true) as approved
      FROM reviews`
    );
    const stats = statsRes.rows[0];

    return NextResponse.json({
      ok: true,
      items: reviews,
      stats: {
        total: parseInt(stats?.total || '0'),
        pending: parseInt(stats?.pending || '0'),
        approved: parseInt(stats?.approved || '0'),
      },
    });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return NextResponse.json(
      { ok: false, error: 'ไม่สามารถโหลดข้อมูลรีวิวได้' },
      { status: 500 }
    );
  }
}
