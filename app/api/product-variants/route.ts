import { NextRequest, NextResponse } from 'next/server';
import { query } from '../../../database/connection';

type DbVariant = {
  variant_id: number;
  product_id: number;
  attribute_value_id: string;
  sku: string | null;
  price: string; // numeric comes back as string from pg
  image_url: string | null;
  is_active: boolean | null;
};

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get('product_id');
    const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit') || 30)));
    const offset = Math.max(0, Number(searchParams.get('offset') || 0));

    // Using lowercase column names without underscores
    let sql = `
      SELECT pv.variantid as variant_id, pv.productid as product_id, pv.attributevalueid as attribute_value_id, pv.sku, pv.price, pv.imageurl as image_url, pv.isactive as is_active,
             av.attributevalueth as attribute_value_th, av.attributevalueen as attribute_value_en,
             a.attributenameth as attribute_name_th, a.attributenameen as attribute_name_en
      FROM productvariants pv
      JOIN attributevalues av ON av.attributevalueid = pv.attributevalueid
      JOIN attributes a ON a.attributeid = av.attributeid
    `;
    
    const params: any[] = [];
    if (productId) {
      sql += ` WHERE pv.productid = $1`;
      params.push(Number(productId));
    }
    
    sql += ` ORDER BY pv.variantid LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await query(sql, params);
    const variants = result.rows as unknown as DbVariant[];

    const items = variants.map((v) => ({
      variant_id: v.variant_id,
      product_id: v.product_id,
      attribute_value_id: v.attribute_value_id,
      sku: v.sku,
      price: Number(v.price),
      image_url: v.image_url,
      is_active: v.is_active,
      variant_name: `${v.attribute_name_th}: ${v.attribute_value_th}`,
    }));

    return NextResponse.json({ ok: true, items });
  } catch (error: any) {
    const message = error?.message || 'Unknown error';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      product_id,
      attribute_value_id,
      sku = null,
      price,
      image_url = null,
      is_active = true,
    } = body || {};

    if (!product_id || !attribute_value_id) {
      return NextResponse.json({ ok: false, error: 'product_id and attribute_value_id are required' }, { status: 400 });
    }
    if (price === undefined || price === null || Number.isNaN(Number(price))) {
      return NextResponse.json({ ok: false, error: 'price is required and must be a number' }, { status: 400 });
    }

    const insertRes = await query(
      `INSERT INTO productvariants (productid, attributevalueid, sku, price, imageurl, isactive)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING variantid as variant_id`,
      [Number(product_id), attribute_value_id, sku, Number(price), image_url, is_active]
    );

    const newId = insertRes.rows[0]?.variant_id;
    return NextResponse.json({ ok: true, id: newId });
  } catch (error: any) {
    const message = error?.message || 'Unknown error';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const body = await req.json();
    const variant_id = Number(body?.variant_id ?? searchParams.get('id'));
    if (!variant_id || Number.isNaN(variant_id)) {
      return NextResponse.json({ ok: false, error: 'variant_id is required' }, { status: 400 });
    }

    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;

    // Map frontend field names to database column names (without underscores)
    const fieldMapping: Record<string, string> = {
      sku: 'sku',
      price: 'price',
      image_url: 'imageurl',
      is_active: 'isactive',
    };

    const updatable = {
      sku: body?.sku,
      price: body?.price !== undefined ? Number(body?.price) : undefined,
      image_url: body?.image_url,
      is_active: body?.is_active,
    } as Record<string, any>;

    for (const [key, value] of Object.entries(updatable)) {
      if (value !== undefined) {
        const dbColumnName = fieldMapping[key] || key;
        fields.push(`${dbColumnName} = $${idx++}`);
        values.push(value);
      }
    }

    if (fields.length === 0) {
      return NextResponse.json({ ok: false, error: 'No fields to update' }, { status: 400 });
    }

    values.push(variant_id);
    const sql = `UPDATE productvariants SET ${fields.join(', ')} WHERE variantid = $${idx}`;
    await query(sql, values);
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    const message = error?.message || 'Unknown error';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const idParam = searchParams.get('id');
    let variant_id: number | null = idParam ? Number(idParam) : null;

    if (!variant_id || Number.isNaN(variant_id)) {
      try {
        const body = await req.json();
        variant_id = Number(body?.variant_id);
      } catch {}
    }

    if (!variant_id || Number.isNaN(variant_id)) {
      return NextResponse.json({ ok: false, error: 'variant_id is required' }, { status: 400 });
    }

    await query(`DELETE FROM productvariants WHERE variantid = $1`, [variant_id]);
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    const message = error?.message || 'Unknown error';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
