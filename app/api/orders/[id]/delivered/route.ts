import { NextRequest, NextResponse } from 'next/server';
import { query } from '../../../../../database/connection';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const orderId = parseInt(id, 10);
    if (isNaN(orderId)) {
      return NextResponse.json({ ok: false, error: 'Invalid order ID' }, { status: 400 });
    }

    const checkRes = await query(
      `SELECT o.orderstatus,
        (SELECT p.paymentstatus FROM payments p WHERE p.orderid = o.orderid ORDER BY p.paymentid DESC LIMIT 1) as paymentstatus
       FROM orders o WHERE o.orderid = $1`,
      [orderId]
    );
    if (checkRes.rows.length === 0) {
      return NextResponse.json({ ok: false, error: 'Order not found' }, { status: 404 });
    }
    const orderStatus = checkRes.rows[0].orderstatus;
    const paymentStatus = checkRes.rows[0].paymentstatus;
    const isPaymentCompleted = paymentStatus === 'completed' || 
      ['confirmed', 'shipped', 'delivered'].includes(orderStatus);

    if (orderStatus !== 'shipped') {
      return NextResponse.json({ 
        ok: false, 
        error: 'สามารถกดยืนยันจัดส่งถึงลูกค้าได้เมื่อสถานะออเดอร์เป็น "จัดส่งแล้ว" เท่านั้น' 
      }, { status: 400 });
    }
    if (!isPaymentCompleted) {
      return NextResponse.json({ 
        ok: false, 
        error: 'สามารถกดยืนยันจัดส่งถึงลูกค้าได้เมื่อชำระเงินสำเร็จแล้วเท่านั้น' 
      }, { status: 400 });
    }

    await query(
      `UPDATE shipments SET deliverystatus = 'delivered', updateddate = CURRENT_TIMESTAMP WHERE orderid = $1`,
      [orderId]
    );

    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    console.error('Error marking order as delivered:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
