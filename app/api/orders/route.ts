import { NextRequest, NextResponse } from 'next/server';
import { query } from '../../../database/connection';

type DbOrder = {
  order_id: number;
  customer_id: number;
  order_date: string;
  total_amount: number;
  order_status: string;
  shipping_address: string;
  notes: string | null;
  created_date: string;
  updated_date: string;
  customer_first_name: string;
  customer_last_name: string;
  customer_email: string;
  item_count: number;
  delivery_status: string;
};

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit') || 50)));
    const offset = Math.max(0, Number(searchParams.get('offset') || 0));
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    const params: any[] = [];
    let whereConditions: string[] = [];

    if (status && status !== 'all') {
      whereConditions.push(`o.orderstatus = $${params.length + 1}`);
      params.push(status);
    }

    if (search) {
      whereConditions.push(`CAST(o.orderid AS TEXT) LIKE $${params.length + 1}`);
      params.push(`%${search}%`);
    }

    const whereSql = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
    
    params.push(limit, offset);

    // Fetch orders with customer info and item count
    const ordersRes = await query(
      `SELECT 
        o.orderid as order_id,
        o.customerid as customer_id,
        o.orderdate as order_date,
        o.totalamount as total_amount,
        o.orderstatus as order_status,
        o.shippingaddress as shipping_address,
        o.notes,
        o.createddate as created_date,
        o.updateddate as updated_date,
        c.firstname as customer_first_name,
        c.lastname as customer_last_name,
        c.email as customer_email,
        COUNT(oi.orderitemid) as item_count,
        CASE 
          WHEN o.orderstatus = 'cancelled' THEN 'ยังไม่ดำเนินการ'
          WHEN o.orderstatus = 'pending' THEN 'ยังไม่ดำเนินการ'
          WHEN o.orderstatus = 'confirmed' THEN 'จัดเตรียมสินค้า'
          WHEN o.orderstatus = 'shipped' THEN 'กำลังจัดส่ง'
          WHEN o.orderstatus = 'delivered' THEN 'จัดส่งสำเร็จ'
          ELSE 'ยังไม่ดำเนินการ'
        END as delivery_status
      FROM orders o
      JOIN customers c ON c.customerid = o.customerid
      LEFT JOIN order_items oi ON oi.orderid = o.orderid
      ${whereSql}
      GROUP BY o.orderid, o.customerid, o.orderdate, o.totalamount, o.orderstatus, 
               o.shippingaddress, o.notes, o.createddate, o.updateddate,
               c.firstname, c.lastname, c.email
      ORDER BY o.orderdate DESC, o.orderid DESC
      LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    const orders = ordersRes.rows as unknown as DbOrder[];

    // Get summary statistics
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString();

    const statsRes = await query(
      `SELECT 
        COUNT(*) FILTER (WHERE DATE(o.orderdate) = DATE($1)) as orders_today,
        COUNT(*) FILTER (WHERE o.orderstatus = 'pending' AND DATE(o.orderdate) = DATE($1)) as pending_today,
        COUNT(*) FILTER (WHERE o.orderstatus IN ('confirmed', 'shipped', 'delivered') AND DATE(o.orderdate) = DATE($1)) as successful_today,
        COALESCE(SUM(o.totalamount) FILTER (WHERE DATE(o.orderdate) = DATE($1)), 0) as sales_today,
        COUNT(*) FILTER (WHERE o.orderstatus = 'pending') as total_pending
      FROM orders o`,
      [todayStr]
    );

    const stats = statsRes.rows[0];

    return NextResponse.json({ 
      ok: true,
      items: orders,
      stats: {
        orders_today: parseInt(stats.orders_today) || 0,
        pending_today: parseInt(stats.pending_today) || 0,
        successful_today: parseInt(stats.successful_today) || 0,
        sales_today: parseFloat(stats.sales_today) || 0,
        total_pending: parseInt(stats.total_pending) || 0,
        success_rate: stats.orders_today > 0 
          ? Math.round((parseInt(stats.successful_today) / parseInt(stats.orders_today)) * 100) 
          : 0
      }
    });
  } catch (error: any) {
    console.error('Error fetching orders:', error);
    const message = error?.message || 'Unknown error';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { order_id, order_status } = body;

    if (!order_id || !order_status) {
      return NextResponse.json({ ok: false, error: 'Missing required fields' }, { status: 400 });
    }

    await query(
      `UPDATE orders 
       SET orderstatus = $1, updateddate = CURRENT_TIMESTAMP
       WHERE orderid = $2`,
      [order_status, order_id]
    );

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error('Error updating order:', error);
    const message = error?.message || 'Unknown error';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const orderId = searchParams.get('id');

    if (!orderId) {
      return NextResponse.json({ ok: false, error: 'Missing order ID' }, { status: 400 });
    }

    await query(
      `DELETE FROM orders WHERE orderid = $1`,
      [orderId]
    );

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error('Error deleting order:', error);
    const message = error?.message || 'Unknown error';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}















