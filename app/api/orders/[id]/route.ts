import { NextRequest, NextResponse } from 'next/server';
import { query } from '../../../../database/connection';

export type OrderItemDetail = {
  order_item_id: number;
  product_name_th: string;
  product_name_en: string;
  sku: string;
  quantity_ordered: number;
  unit_price: number;
  total_price: number;
  attribute_values: string | null;
};

export type OrderDetail = {
  order_id: number;
  customer_id: number;
  order_date: string;
  total_amount: number;
  order_status: string;
  payment_status: string;
  shipping_address: string;
  notes: string | null;
  customer_first_name: string;
  customer_last_name: string;
  customer_email: string;
  item_count: number;
  delivery_status: string;
  items: OrderItemDetail[];
};

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const orderId = parseInt(id, 10);
    if (isNaN(orderId)) {
      return NextResponse.json({ ok: false, error: 'Invalid order ID' }, { status: 400 });
    }

    const orderRes = await query(
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
        c.firstname as customer_first_name,
        c.lastname as customer_last_name,
        c.email as customer_email,
        COUNT(oi.orderitemid) OVER (PARTITION BY o.orderid) as item_count,
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
      WHERE o.orderid = $1
      LIMIT 1`,
      [orderId]
    );

    if (orderRes.rows.length === 0) {
      return NextResponse.json({ ok: false, error: 'Order not found' }, { status: 404 });
    }

    const order = orderRes.rows[0] as any;
    const itemCount = parseInt(order.item_count) || 0;

    let items: OrderItemDetail[] = [];
    if (itemCount > 0) {
      const itemsRes = await query(
        `SELECT 
          oi.orderitemid as order_item_id,
          p.productnameth as product_name_th,
          p.productnameen as product_name_en,
          pv.sku as sku,
          oi.quantityordered as quantity_ordered,
          oi.unitprice::numeric as unit_price,
          oi.totalprice::numeric as total_price,
          STRING_AGG(DISTINCT av.attributevalueth, ', ') as attribute_values
        FROM order_items oi
        JOIN inventories i ON i.inventoryid = oi.inventoryid
        JOIN productvariants pv ON pv.variantid = i.variantid
        JOIN products p ON p.productid = pv.productid
        LEFT JOIN productvariantattributes pva ON pva.variantid = pv.variantid
        LEFT JOIN attributevalues av ON av.attributevalueid = pva.attributevalueid
        WHERE oi.orderid = $1
        GROUP BY oi.orderitemid, oi.quantityordered, oi.unitprice, oi.totalprice,
                 p.productnameth, p.productnameen, pv.sku`,
        [orderId]
      );
      items = itemsRes.rows as unknown as OrderItemDetail[];
    }

    const result: OrderDetail = {
      order_id: order.order_id,
      customer_id: order.customer_id,
      order_date: order.order_date,
      total_amount: parseFloat(order.total_amount),
      order_status: order.order_status,
      payment_status: order.payment_status || 'pending',
      shipping_address: order.shipping_address,
      notes: order.notes,
      customer_first_name: order.customer_first_name,
      customer_last_name: order.customer_last_name,
      customer_email: order.customer_email,
      item_count: itemCount,
      delivery_status: order.delivery_status,
      items,
    };

    return NextResponse.json({ ok: true, order: result });
  } catch (error: unknown) {
    console.error('Error fetching order detail:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
