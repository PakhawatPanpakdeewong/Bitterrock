import { NextRequest, NextResponse } from 'next/server';
import { query } from '../../../database/connection';

type DbOrder = {
  order_id: number;
  customer_id: number;
  order_date: string;
  total_amount: number;
  order_status: string;
  payment_status: string;
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
      if (status === 'shipped') {
        whereConditions.push(`(o.orderstatus = 'shipped' OR o.orderstatus = 'delivered')`);
      } else {
        whereConditions.push(`o.orderstatus = $${params.length + 1}`);
        params.push(status);
      }
    }

    if (search) {
      whereConditions.push(`CAST(o.orderid AS TEXT) LIKE $${params.length + 1}`);
      params.push(`%${search}%`);
    }

    const whereSql = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
    
    params.push(limit, offset);

    // Fetch orders with customer info, item count, payment_status (สถานะการสั่งซื้อ), order_status (สถานะออเดอร์/การจัดส่ง)
    const ordersRes = await query(
      `SELECT 
        o.orderid as order_id,
        o.customerid as customer_id,
        o.orderdate as order_date,
        o.totalamount as total_amount,
        o.orderstatus as order_status,
        COALESCE(
          (SELECT p.paymentstatus FROM payments p WHERE p.orderid = o.orderid ORDER BY p.paymentid DESC LIMIT 1),
          CASE 
            WHEN o.orderstatus = 'cancelled' THEN 'failed'
            WHEN o.orderstatus IN ('confirmed', 'shipped', 'delivered') THEN 'completed'
            ELSE 'pending'
          END
        ) as payment_status,
        o.shippingaddress as shipping_address,
        o.notes,
        o.createddate as created_date,
        o.updateddate as updated_date,
        c.firstname as customer_first_name,
        c.lastname as customer_last_name,
        c.email as customer_email,
        COUNT(oi.orderitemid) as item_count,
        CASE 
          WHEN o.orderstatus = 'cancelled' THEN 'cancelled'
          WHEN o.orderstatus = 'pending' THEN 'pending'
          WHEN o.orderstatus = 'confirmed' THEN 'confirmed'
          WHEN o.orderstatus = 'shipped' THEN 'shipped'
          WHEN o.orderstatus = 'delivered' THEN 'shipped'
          ELSE 'pending'
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

    // Get current order status and payment status
    const currentRes = await query(
      `SELECT o.orderstatus,
        (SELECT p.paymentstatus FROM payments p WHERE p.orderid = o.orderid ORDER BY p.paymentid DESC LIMIT 1) as paymentstatus
       FROM orders o WHERE o.orderid = $1`,
      [order_id]
    );
    if (currentRes.rows.length === 0) {
      return NextResponse.json({ ok: false, error: 'Order not found' }, { status: 404 });
    }
    const currentOrderStatus = currentRes.rows[0].orderstatus;
    const paymentStatus = currentRes.rows[0].paymentstatus;
    const isPaymentCompleted = paymentStatus === 'completed' || 
      ['confirmed', 'shipped', 'delivered'].includes(currentOrderStatus);

    // ตรวจสอบการเปลี่ยนสถานะ: ห้ามข้ามขั้นตอน pending -> confirmed -> shipped
    // ถ้าจ่ายเงินสำเร็จแล้ว ห้ามยกเลิก
    let allowed: string[] = [];
    const current = currentOrderStatus === 'delivered' ? 'shipped' : currentOrderStatus;
    if (current === 'pending') {
      allowed = isPaymentCompleted ? ['confirmed'] : ['confirmed', 'cancelled'];
    } else if (current === 'confirmed') {
      allowed = ['shipped']; // จ่ายเงินสำเร็จแล้ว ไม่ให้ยกเลิก
    } else if (current === 'shipped' || current === 'cancelled') {
      allowed = [];
    }
    if (!allowed.includes(order_status)) {
      if (order_status === 'cancelled' && isPaymentCompleted) {
        return NextResponse.json({ 
          ok: false, 
          error: 'ไม่สามารถยกเลิกออเดอร์ที่ชำระเงินสำเร็จแล้วได้' 
        }, { status: 400 });
      }
      return NextResponse.json({ 
        ok: false, 
        error: 'การเปลี่ยนสถานะไม่ถูกต้อง ห้ามข้ามขั้นตอนหรือย้อนกลับ (ยังไม่ดำเนินการ → ยืนยันออเดอร์ → จัดส่งแล้ว)' 
      }, { status: 400 });
    }

    // Update order status
    await query(
      `UPDATE orders 
       SET orderstatus = $1, updateddate = CURRENT_TIMESTAMP
       WHERE orderid = $2`,
      [order_status, order_id]
    );

    // เมื่อเปลี่ยนจาก รอการชำระเงิน(pending) เป็น ยืนยันออเดอร์(confirmed) ให้อัปเดต payment status เป็น completed ด้วย
    if (currentOrderStatus === 'pending' && order_status === 'confirmed') {
      await query(
        `UPDATE payments 
         SET paymentstatus = 'completed', updateddate = CURRENT_TIMESTAMP
         WHERE orderid = $1`,
        [order_id]
      );
    }
    // เมื่อยกเลิกออเดอร์ ให้อัปเดต payment status เป็น failed ด้วย
    if (order_status === 'cancelled') {
      await query(
        `UPDATE payments 
         SET paymentstatus = 'failed', updateddate = CURRENT_TIMESTAMP
         WHERE orderid = $1 AND paymentstatus = 'pending'`,
        [order_id]
      );
    }

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

    // ตรวจสอบว่าจ่ายเงินสำเร็จแล้วหรือไม่ - ถ้าสำเร็จแล้วห้ามลบ
    const checkRes = await query(
      `SELECT o.orderstatus,
        (SELECT p.paymentstatus FROM payments p WHERE p.orderid = o.orderid ORDER BY p.paymentid DESC LIMIT 1) as paymentstatus
       FROM orders o WHERE o.orderid = $1`,
      [orderId]
    );
    if (checkRes.rows.length === 0) {
      return NextResponse.json({ ok: false, error: 'Order not found' }, { status: 404 });
    }
    const row = checkRes.rows[0];
    const paymentStatus = row.paymentstatus;
    const orderStatus = row.orderstatus;
    const isPaymentCompleted = paymentStatus === 'completed' || 
      ['confirmed', 'shipped', 'delivered'].includes(orderStatus);
    if (isPaymentCompleted) {
      return NextResponse.json({ 
        ok: false, 
        error: 'ไม่สามารถลบออเดอร์ที่ชำระเงินสำเร็จแล้วได้' 
      }, { status: 400 });
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















