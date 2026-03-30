import { NextRequest, NextResponse } from 'next/server';
import { query } from '../../../database/connection';
import { getCurrentUser } from '@/lib/auth';
import { logStaffActivity } from '@/database/activity-log';

/** ไม่แคชผลลัพธ์ — ยอด/รายการต้องตรงกับฐานข้อมูลล่าสุด */
export const dynamic = 'force-dynamic';

/** ใช้กับ orderdate (timestamptz) เพื่อให้ "วันนี้ / เดือนนี้" ตรงกับปฏิทินไทย ไม่เพี้ยนเพราะ UTC */
const TZ_STORE = 'Asia/Bangkok';

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
    const dateFilter = searchParams.get('date');

    const params: any[] = [];
    let whereConditions: string[] = [];

    if (dateFilter === 'today') {
      whereConditions.push(
        `(timezone($${params.length + 1}, o.orderdate))::date = (timezone($${params.length + 1}, now()))::date`
      );
      params.push(TZ_STORE);
    }

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
          WHEN o.orderstatus = 'delivered' THEN 'delivered'
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

    // สถิติ "วันนี้ / เดือนนี้" ตามปฏิทินไทย (สอดคล้องกับตัวกรอง date=today)
    const statsRes = await query(
      `SELECT 
        COUNT(*) FILTER (
          WHERE (timezone($1, o.orderdate))::date = (timezone($1, now()))::date
        ) as orders_today,
        COUNT(*) FILTER (
          WHERE o.orderstatus = 'pending'
          AND (timezone($1, o.orderdate))::date = (timezone($1, now()))::date
        ) as pending_today,
        COUNT(*) FILTER (
          WHERE o.orderstatus IN ('confirmed', 'shipped', 'delivered')
          AND (timezone($1, o.orderdate))::date = (timezone($1, now()))::date
        ) as successful_today,
        COALESCE(SUM(o.totalamount) FILTER (
          WHERE (timezone($1, o.orderdate))::date = (timezone($1, now()))::date
        ), 0) as sales_today,
        COUNT(*) FILTER (
          WHERE (timezone($1, o.orderdate))::date >= (date_trunc('month', timezone($1, now())))::date
          AND (timezone($1, o.orderdate))::date < (date_trunc('month', timezone($1, now())) + interval '1 month')::date
        ) as orders_this_month,
        COALESCE(SUM(o.totalamount) FILTER (
          WHERE (timezone($1, o.orderdate))::date >= (date_trunc('month', timezone($1, now())))::date
          AND (timezone($1, o.orderdate))::date < (date_trunc('month', timezone($1, now())) + interval '1 month')::date
        ), 0) as sales_this_month,
        COUNT(*) FILTER (WHERE o.orderstatus = 'pending') as total_pending
      FROM orders o`,
      [TZ_STORE]
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
        orders_this_month: parseInt(stats.orders_this_month) || 0,
        sales_this_month: parseFloat(stats.sales_this_month) || 0,
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
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { order_id, order_status, tracking_number } = body;

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
        error: 'การเปลี่ยนสถานะไม่ถูกต้อง ห้ามข้ามขั้นตอนหรือย้อนกลับ (ยังไม่ดำเนินการ → ยืนยันออเดอร์ → กำลังจัดส่ง)' 
      }, { status: 400 });
    }

    // เมื่อเปลี่ยนเป็น "กำลังจัดส่ง" (shipped) ต้องมีเลขติดตามก่อน — ให้ผู้ใช้กรอกเอง
    let assignedTrackingNumber: string | null = null;
    if (order_status === 'shipped') {
      if (!tracking_number || typeof tracking_number !== 'string' || tracking_number.trim() === '') {
        return NextResponse.json(
          { ok: false, error: 'กรุณากรอกเลข Tracking Number ก่อนเปลี่ยนสถานะเป็นกำลังจัดส่ง' },
          { status: 400 }
        );
      }

      const normalized = tracking_number.trim();
      // ต้องเป็นตัวอักษรอังกฤษพิมพ์ใหญ่ A-Z หรือเลข 0-9 เท่านั้น และยาว 13 ตัวอักษร
      if (!/^[A-Z0-9]{13}$/.test(normalized)) {
        return NextResponse.json(
          {
            ok: false,
            error:
              'รูปแบบ Tracking Number ไม่ถูกต้อง (ต้องเป็นตัวอักษร A-Z หรือเลข 0-9 จำนวน 13 ตัวอักษร เช่น OB416416775TH)',
          },
          { status: 400 }
        );
      }

      const usedRes = await query(
        `SELECT trackingnumber FROM shipments WHERE trackingnumber IS NOT NULL
         UNION
         SELECT trackingnumber FROM payments WHERE trackingnumber IS NOT NULL`,
        []
      );
      const usedSet = new Set(
        (usedRes.rows as { trackingnumber: string }[])
          .map((r) => r.trackingnumber)
          .filter(Boolean)
      );
      if (usedSet.has(normalized)) {
        return NextResponse.json(
          { ok: false, error: 'Tracking Number นี้ถูกใช้ไปแล้ว กรุณาใช้หมายเลขอื่น' },
          { status: 400 }
        );
      }

      assignedTrackingNumber = normalized;
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

    // บันทึกเลขติดตามลง shipments (มี assignedTrackingNumber แน่นอนเมื่อ order_status === 'shipped')
    if (order_status === 'shipped' && assignedTrackingNumber) {
      const updateRes = await query(
        `UPDATE shipments SET deliverystatus = 'shipped', trackingnumber = $1, updateddate = CURRENT_TIMESTAMP WHERE orderid = $2`,
        [assignedTrackingNumber, order_id]
      );
      if (updateRes.rowCount === 0) {
        await query(
          `INSERT INTO shipments (orderid, trackingnumber, deliverystatus) VALUES ($1, $2, 'shipped')`,
          [order_id, assignedTrackingNumber]
        );
      }
    }

    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || null;
    await logStaffActivity({
      user,
      actionType: 'update_order_status',
      resourceType: 'order',
      resourceId: order_id,
      ipAddress: ip,
      details: {
        from_status: currentOrderStatus,
        to_status: order_status,
        tracking_number: assignedTrackingNumber ?? tracking_number ?? null,
      },
    });

    return NextResponse.json({
      ok: true,
      ...(assignedTrackingNumber ? { tracking_number: assignedTrackingNumber } : {}),
    });
  } catch (error: any) {
    console.error('Error updating order:', error);
    const message = error?.message || 'Unknown error';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }

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

    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || null;
    await logStaffActivity({
      user,
      actionType: 'delete_order',
      resourceType: 'order',
      resourceId: orderId,
      ipAddress: ip,
      details: {
        order_status: orderStatus,
        payment_status: paymentStatus,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error('Error deleting order:', error);
    const message = error?.message || 'Unknown error';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}















