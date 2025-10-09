import { NextRequest, NextResponse } from 'next/server';
import { query } from '../../../database/connection';

type DbProduct = {
  product_id: number;
  sub_category_id: string | null;
  product_name_th: string;
  product_name_en: string;
  description: string | null;
  base_sku: string | null;
  base_price: string; // numeric comes back as string from pg
  sub_category_name: string | null;
};

type DbVariant = {
  variant_id: number;
  product_id: number;
  attribute_value_id: string;
  attribute_name_th: string;
  attribute_name_en: string;
  attribute_value_th: string;
  attribute_value_en: string;
  sku: string | null;
  price: string; // numeric
  image_url: string | null;
  is_active: boolean | null;
};

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit') || 30)));
    const offset = Math.max(0, Number(searchParams.get('offset') || 0));

    // Fetch products with subcategory name (use redesigned columns)
    const productsRes = await query(
      `SELECT p.product_id, p.sub_category_id, p.product_name_th, p.product_name_en, p.description, p.base_sku, p.base_price,
              sc.sub_category_name
       FROM products p
       LEFT JOIN sub_categories sc ON sc.sub_category_id = p.sub_category_id
       ORDER BY p.product_id
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    const products = productsRes.rows as unknown as DbProduct[];
    if (products.length === 0) {
      return NextResponse.json({ ok: true, items: [] });
    }

    const productIds = products.map((p) => p.product_id);

    // Fetch variants for these products; join attribute values and attributes for labels
    const variantsRes = await query(
      `SELECT pv.variant_id, pv.product_id, pv.attribute_value_id, pv.sku, pv.price, pv.image_url, pv.is_active,
              av.attribute_value_th, av.attribute_value_en,
              a.attribute_name_th, a.attribute_name_en
       FROM product_variants pv
       JOIN attribute_values av ON av.attribute_value_id = pv.attribute_value_id
       JOIN attributes a ON a.attribute_id = av.attribute_id
       WHERE pv.product_id = ANY($1::int[])
       ORDER BY pv.product_id, pv.variant_id`,
      [productIds]
    );

    const productIdToVariants: Record<number, DbVariant[]> = {};
    for (const v of variantsRes.rows as unknown as DbVariant[]) {
      if (!productIdToVariants[v.product_id]) productIdToVariants[v.product_id] = [];
      productIdToVariants[v.product_id].push(v);
    }

    const items = products.map((p) => ({
      id: p.product_id,
      sub_categories_name: p.sub_category_name,
      // keep field name 'product_name' for frontend compatibility; use TH name by default
      product_name: p.product_name_th,
      product_name_th: p.product_name_th,
      product_name_en: p.product_name_en,
      description: p.description,
      base_sku: p.base_sku,
      base_price: Number(p.base_price),
      variants: (productIdToVariants[p.product_id] || []).map((v) => ({
        variant_id: v.variant_id,
        // build a human label from attribute name + value
        variant_name: `${v.attribute_name_th}: ${v.attribute_value_th}`,
        sku: v.sku,
        price: Number(v.price),
        image_url: v.image_url,
      })),
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
      sub_category_id = null,
      product_name_th,
      product_name_en,
      description = null,
      base_sku = null,
      base_price,
    } = body || {};

    if (!product_name_th || !product_name_en) {
      return NextResponse.json({ ok: false, error: 'product_name_th and product_name_en are required' }, { status: 400 });
    }
    if (base_price === undefined || base_price === null || Number.isNaN(Number(base_price))) {
      return NextResponse.json({ ok: false, error: 'base_price is required and must be a number' }, { status: 400 });
    }

    const insertRes = await query(
      `INSERT INTO products (sub_category_id, product_name_th, product_name_en, description, base_sku, base_price)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING product_id`,
      [sub_category_id, product_name_th, product_name_en, description, base_sku, Number(base_price)]
    );

    const newId = insertRes.rows[0]?.product_id;
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
    const product_id = Number(body?.product_id ?? searchParams.get('id'));
    if (!product_id || Number.isNaN(product_id)) {
      return NextResponse.json({ ok: false, error: 'product_id is required' }, { status: 400 });
    }

    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;

    const updatable = {
      sub_category_id: body?.sub_category_id,
      product_name_th: body?.product_name_th,
      product_name_en: body?.product_name_en,
      description: body?.description,
      base_sku: body?.base_sku,
      base_price: body?.base_price !== undefined ? Number(body?.base_price) : undefined,
    } as Record<string, any>;

    for (const [key, value] of Object.entries(updatable)) {
      if (value !== undefined) {
        fields.push(`${key} = $${idx++}`);
        values.push(value);
      }
    }

    if (fields.length === 0) {
      return NextResponse.json({ ok: false, error: 'No fields to update' }, { status: 400 });
    }

    values.push(product_id);
    const sql = `UPDATE products SET ${fields.join(', ')} WHERE product_id = $${idx}`;
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
    let product_id: number | null = idParam ? Number(idParam) : null;

    if (!product_id || Number.isNaN(product_id)) {
      try {
        const body = await req.json();
        product_id = Number(body?.product_id);
      } catch {}
    }

    if (!product_id || Number.isNaN(product_id)) {
      return NextResponse.json({ ok: false, error: 'product_id is required' }, { status: 400 });
    }

    await query(`DELETE FROM products WHERE product_id = $1`, [product_id]);
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    const message = error?.message || 'Unknown error';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
