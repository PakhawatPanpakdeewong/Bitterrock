import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/database/connection';

export type SlipOrderItem = {
  order_id: number;
  payment_id: number;
  order_date: string;
  total_amount: number;
  payment_status: string;
  customer_name: string;
};

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit') || 50)));
    const offset = Math.max(0, Number(searchParams.get('offset') || 0));

    const params: (string | number)[] = [];
    const conditions: string[] = [];

    if (search.trim()) {
      conditions.push(`CAST(o.orderid AS TEXT) LIKE $${params.length + 1}`);
      params.push(`%${search.trim()}%`);
    }

    const whereSql = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    params.push(limit, offset);

    const res = await query(
      `SELECT 
        o.orderid as order_id,
        p.paymentid as payment_id,
        o.orderdate as order_date,
        o.totalamount as total_amount,
        p.paymentstatus as payment_status,
        CONCAT(c.firstname, ' ', c.lastname) as customer_name
      FROM orders o
      JOIN payments p ON p.orderid = o.orderid
      JOIN customers c ON c.customerid = o.customerid
      ${whereSql}
      ORDER BY o.orderdate DESC, o.orderid DESC, p.paymentid DESC
      LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    const items = res.rows as unknown as SlipOrderItem[];

    const countRes = await query(
      `SELECT COUNT(*) as total
       FROM orders o
       JOIN payments p ON p.orderid = o.orderid
       ${whereSql}`,
      params.slice(0, -2)
    );
    const total = parseInt(countRes.rows[0]?.total as string, 10) || 0;

    return NextResponse.json({ ok: true, items, total });
  } catch (error: unknown) {
    console.error('Slips orders API error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
