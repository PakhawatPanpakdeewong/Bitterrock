import { NextRequest, NextResponse } from 'next/server';
import { query } from '../../../database/connection';

type DbInventory = {
  inventory_id: number;
  product_id: number;
  variant_id: number | null;
  warehouse_id: number;
  stock_quantity: number;
  reserved_quantity: number;
  available_quantity: number;
  expired_date: string | null;
  created_date: string | null;
  product_name_th: string;
  product_name_en: string;
  sub_category_name: string | null;
  variant_sku: string | null;
  variant_price: string | null;
  is_active: boolean | null;
  attribute_value_th: string | null;
  attribute_value_en: string | null;
  warehouse_name: string;
};

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const warehouseId = searchParams.get('warehouse_id');
    const productId = searchParams.get('product_id');
    const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit') || 50)));
    const offset = Math.max(0, Number(searchParams.get('offset') || 0));

    const params: any[] = [];
    let whereConditions: string[] = [];

    if (warehouseId) {
      whereConditions.push(`i.warehouseid = $${params.length + 1}`);
      params.push(Number(warehouseId));
    }

    if (productId) {
      whereConditions.push(`i.productid = $${params.length + 1}`);
      params.push(Number(productId));
    }

    const whereSql = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
    
    params.push(limit, offset);

    const inventoryRes = await query(
      `SELECT 
        i.inventoryid as inventory_id,
        i.productid as product_id,
        i.variantid as variant_id,
        i.warehouseid as warehouse_id,
        i.stockquantity as stock_quantity,
        i.reservedquantity as reserved_quantity,
        i.availablequantity as available_quantity,
        i.expireddate as expired_date,
        i.createddate as created_date,
        p.productnameth as product_name_th,
        p.productnameen as product_name_en,
        sc.subcategorynameth as sub_category_name,
        pv.sku as variant_sku,
        pv.price as variant_price,
        pv.isactive as is_active,
        STRING_AGG(DISTINCT av.attributevalueth, ', ' ORDER BY av.attributevalueth) as attribute_value_th,
        STRING_AGG(DISTINCT av.attributevalueen, ', ' ORDER BY av.attributevalueen) as attribute_value_en,
        w.warehousename as warehouse_name
      FROM inventories i
      JOIN products p ON p.productid = i.productid
      LEFT JOIN subcategories sc ON sc.subcategoryid = p.subcategoryid
      LEFT JOIN productvariants pv ON pv.variantid = i.variantid
      LEFT JOIN productvariantattributes pva ON pva.variantid = pv.variantid
      LEFT JOIN attributevalues av ON av.attributevalueid = pva.attributevalueid
      JOIN warehouses w ON w.warehouseid = i.warehouseid
      ${whereSql}
      GROUP BY i.inventoryid, i.productid, i.variantid, i.warehouseid, i.stockquantity, i.reservedquantity, 
               i.availablequantity, i.expireddate, i.createddate, p.productnameth, p.productnameen, 
               sc.subcategorynameth, pv.sku, pv.price, pv.isactive, w.warehousename
      ORDER BY i.inventoryid DESC
      LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    const items = inventoryRes.rows as unknown as DbInventory[];

    return NextResponse.json({ 
      ok: true, 
      items: items.map(item => ({
        inventory_id: item.inventory_id,
        product_id: item.product_id,
        variant_id: item.variant_id,
        warehouse_id: item.warehouse_id,
        stock_quantity: item.stock_quantity,
        reserved_quantity: item.reserved_quantity,
        available_quantity: item.available_quantity,
        expired_date: item.expired_date,
        created_date: item.created_date,
        product_name_th: item.product_name_th,
        product_name_en: item.product_name_en,
        sub_category_name: item.sub_category_name,
        variant_sku: item.variant_sku,
        price: item.variant_price ? Number(item.variant_price) : null,
        is_active: item.is_active,
        attribute_value_th: item.attribute_value_th,
        attribute_value_en: item.attribute_value_en,
        warehouse_name: item.warehouse_name,
      }))
    });
  } catch (error: any) {
    console.error('Error fetching inventory:', error);
    const message = error?.message || 'Unknown error';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      product_id,
      variant_id = null,
      warehouse_id,
      stock_quantity,
      reserved_quantity = 0,
      expired_date = null,
    } = body;

    if (!product_id || !warehouse_id || stock_quantity === undefined) {
      return NextResponse.json({ 
        ok: false, 
        error: 'product_id, warehouse_id, and stock_quantity are required' 
      }, { status: 400 });
    }

    // Ensure values are numbers
    const stockQty = Number(stock_quantity) || 0;
    const reservedQty = Number(reserved_quantity) || 0;
    const availableQuantity = Math.max(0, stockQty - reservedQty);

    const insertRes = await query(
      `INSERT INTO inventories (productid, variantid, warehouseid, stockquantity, reservedquantity, availablequantity, expireddate)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING inventoryid as inventory_id`,
      [
        product_id,
        variant_id,
        warehouse_id,
        stockQty,
        reservedQty,
        availableQuantity,
        expired_date,
      ]
    );

    const newId = insertRes.rows[0]?.inventory_id;
    return NextResponse.json({ ok: true, id: newId });
  } catch (error: any) {
    console.error('Error creating inventory:', error);
    const message = error?.message || 'Unknown error';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { inventory_id, stock_quantity, reserved_quantity, expired_date, is_active } = body;

    if (!inventory_id) {
      return NextResponse.json({ ok: false, error: 'inventory_id is required' }, { status: 400 });
    }

    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (stock_quantity !== undefined) {
      fields.push(`stockquantity = $${idx++}`);
      values.push(stock_quantity);
    }

    if (reserved_quantity !== undefined) {
      fields.push(`reservedquantity = $${idx++}`);
      values.push(reserved_quantity);
    }

    if (expired_date !== undefined) {
      fields.push(`expireddate = $${idx++}`);
      values.push(expired_date);
    }

    if (is_active !== undefined) {
      // Update isactive in product_variants table if variant_id exists
      // First, get the variant_id from inventory
      const inventoryRes = await query(
        `SELECT variantid FROM inventories WHERE inventoryid = $1`,
        [inventory_id]
      );
      const variantId = inventoryRes.rows[0]?.variantid;
      
      if (variantId) {
        await query(
          `UPDATE productvariants SET isactive = $1 WHERE variantid = $2`,
          [is_active, variantId]
        );
      }
    }

    // Recalculate available_quantity if stock_quantity or reserved_quantity changed
    if (stock_quantity !== undefined || reserved_quantity !== undefined) {
      // Get current values if not provided
      const currentRes = await query(
        `SELECT stockquantity, reservedquantity FROM inventories WHERE inventoryid = $1`,
        [inventory_id]
      );
      const current = currentRes.rows[0];
      const finalStock = stock_quantity !== undefined ? stock_quantity : current.stockquantity;
      const finalReserved = reserved_quantity !== undefined ? reserved_quantity : current.reservedquantity;
      const availableQuantity = Math.max(0, finalStock - finalReserved);
      fields.push(`availablequantity = $${idx++}`);
      values.push(availableQuantity);
    }

    if (fields.length === 0) {
      return NextResponse.json({ ok: false, error: 'No fields to update' }, { status: 400 });
    }

    values.push(inventory_id);
    const sql = `UPDATE inventories SET ${fields.join(', ')} WHERE inventoryid = $${idx}`;
    await query(sql, values);

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error('Error updating inventory:', error);
    const message = error?.message || 'Unknown error';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const idParam = searchParams.get('id');
    let inventory_id: number | null = idParam ? Number(idParam) : null;

    if (!inventory_id || Number.isNaN(inventory_id)) {
      try {
        const body = await req.json();
        inventory_id = Number(body?.inventory_id);
      } catch {}
    }

    if (!inventory_id || Number.isNaN(inventory_id)) {
      return NextResponse.json({ ok: false, error: 'inventory_id is required' }, { status: 400 });
    }

    await query(`DELETE FROM inventories WHERE inventoryid = $1`, [inventory_id]);
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error('Error deleting inventory:', error);
    const message = error?.message || 'Unknown error';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

