import { NextRequest, NextResponse } from 'next/server';
import { query } from '../../../database/connection';

type DbVariant = {
  variant_id: number;
  product_id: number;
  sku: string | null;
  price: string; // numeric comes back as string from pg
  image_url: string | null;
  is_active: boolean | null;
  attribute_value_th: string | null;
  attribute_value_en: string | null;
  attribute_name_th: string | null;
  attribute_name_en: string | null;
};

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get('product_id');
    const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit') || 30)));
    const offset = Math.max(0, Number(searchParams.get('offset') || 0));

    // Using lowercase column names without underscores
    const categoryId = searchParams.get('category_id');
    
    let sql = `
      SELECT pv.variantid as variant_id, pv.productid as product_id, pv.sku, pv.price, pv.cost, pv.isactive as is_active,
             p.productnameth as product_name_th,
             sc.subcategorynameth as sub_category_name_th,
             sc.subcategorynameen as sub_category_name_en,
             c.categoryid as category_id,
             c.categorynameth as category_name_th,
             c.categorynameen as category_name_en,
             json_agg(
               json_build_object(
                 'attribute_name_th', a.attributenameth,
                 'attribute_value_th', av.attributevalueth
               ) ORDER BY a.attributenameth
             ) FILTER (WHERE a.attributenameth IS NOT NULL) as attributes
      FROM productvariants pv
      LEFT JOIN products p ON p.productid = pv.productid
      LEFT JOIN subcategories sc ON sc.subcategoryid = p.subcategoryid
      LEFT JOIN categories c ON c.categoryid = sc.categoryid
      LEFT JOIN productvariantattributes pva ON pva.variantid = pv.variantid
      LEFT JOIN attributevalues av ON av.attributevalueid = pva.attributevalueid
      LEFT JOIN attributes a ON a.attributeid = av.attributeid
    `;
    
    const params: any[] = [];
    const conditions: string[] = [];
    
    if (productId) {
      conditions.push(`pv.productid = $${params.length + 1}`);
      params.push(Number(productId));
    }
    
    if (categoryId && categoryId !== 'all') {
      conditions.push(`c.categoryid = $${params.length + 1}`);
      params.push(Number(categoryId));
    }
    
    if (conditions.length > 0) {
      sql += ` WHERE ${conditions.join(' AND ')}`;
    }
    
    sql += ` GROUP BY pv.variantid, pv.productid, pv.sku, pv.price, pv.cost, pv.isactive, p.productnameth, sc.subcategorynameth, sc.subcategorynameen, c.categoryid, c.categorynameth, c.categorynameen
             ORDER BY pv.variantid LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await query(sql, params);
    const variants = result.rows as Array<{
      variant_id: number;
      product_id: number;
      sku: string | null;
      price: string;
      cost?: string | null;
      image_url?: string | null;
      is_active: boolean | null;
      product_name_th: string;
      sub_category_name_th: string | null;
      sub_category_name_en: string | null;
      category_id: number | null;
      category_name_th: string | null;
      category_name_en: string | null;
      attributes: Array<{ attribute_name_th: string; attribute_value_th: string }> | null;
    }>;

    const items = variants.map((v) => ({
      variant_id: v.variant_id,
      product_id: v.product_id,
      product_name_th: v.product_name_th,
      sub_category_name_th: v.sub_category_name_th,
      sub_category_name_en: v.sub_category_name_en,
      category_id: v.category_id,
      category_name_th: v.category_name_th,
      category_name_en: v.category_name_en,
      attributes: v.attributes || [],
      sku: v.sku,
      price: Number(v.price),
      cost: v.cost != null ? Number(v.cost) : null,
      image_url: v.image_url ?? null,
      is_active: v.is_active,
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
      attribute_value_ids, // Can be array or single value
      sku = null,
      price,
      cost = null,
      image_url = null,
      is_active = true,
    } = body || {};

    if (!product_id) {
      return NextResponse.json({ ok: false, error: 'product_id is required' }, { status: 400 });
    }
    if (price === undefined || price === null || Number.isNaN(Number(price))) {
      return NextResponse.json({ ok: false, error: 'price is required and must be a number' }, { status: 400 });
    }
    if (!sku || sku.trim() === '') {
      return NextResponse.json({ ok: false, error: 'sku is required' }, { status: 400 });
    }

    // Normalize attribute_value_ids to array
    const attributeValueIds = Array.isArray(attribute_value_ids) 
      ? attribute_value_ids 
      : attribute_value_ids 
        ? [attribute_value_ids] 
        : [];

    // Insert variant first (without attributes)
    const insertRes = await query(
      `INSERT INTO productvariants (productid, sku, price, cost, isactive)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING variantid as variant_id`,
      [Number(product_id), sku, Number(price), cost != null && !Number.isNaN(Number(cost)) ? Number(cost) : null, is_active]
    );

    const variantId = insertRes.rows[0].variant_id;

    // Insert attributes ONLY if variant is active
    // ProductVariantAttributes should only be created when user enables the variant
    if (is_active && attributeValueIds.length > 0) {
      for (const attributeValueId of attributeValueIds) {
        await query(
          `INSERT INTO productvariantattributes (variantid, attributevalueid)
           VALUES ($1, $2)
           ON CONFLICT (variantid, attributevalueid) DO NOTHING`,
          [variantId, Number(attributeValueId)]
        );
      }
    }

    return NextResponse.json({ ok: true, id: variantId });
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

    // Get current variant state to check if is_active is changing
    const currentVariantRes = await query(
      `SELECT isactive FROM productvariants WHERE variantid = $1`,
      [variant_id]
    );
    if (currentVariantRes.rows.length === 0) {
      return NextResponse.json({ ok: false, error: 'Variant not found' }, { status: 404 });
    }
    const currentIsActive = currentVariantRes.rows[0]?.isactive ?? false;
    const newIsActive = body?.is_active;

    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;

    // Map frontend field names to database column names (without underscores)
    const fieldMapping: Record<string, string> = {
      sku: 'sku',
      price: 'price',
      cost: 'cost',
      image_url: 'imageurl',
      is_active: 'isactive',
    };

    const updatable = {
      sku: body?.sku,
      price: body?.price !== undefined ? Number(body?.price) : undefined,
      cost: body?.cost !== undefined ? (body?.cost != null && !Number.isNaN(Number(body?.cost)) ? Number(body?.cost) : null) : undefined,
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

    // Handle ProductVariantAttributes based on is_active change
    // ProductVariantAttributes should only exist when variant is active
    if (newIsActive !== undefined && newIsActive !== currentIsActive) {
      if (newIsActive === false) {
        // Delete ProductVariantAttributes when disabling variant
        await query(
          `DELETE FROM productvariantattributes WHERE variantid = $1`,
          [variant_id]
        );
      } else {
        // When enabling variant, create ProductVariantAttributes if attribute_value_ids provided
        // Otherwise, if variant was previously disabled and re-enabled, we don't recreate attributes
        // (because they were deleted when disabled)
        const attributeValueIds = body?.attribute_value_ids;
        if (attributeValueIds && Array.isArray(attributeValueIds) && attributeValueIds.length > 0) {
          for (const attributeValueId of attributeValueIds) {
            await query(
              `INSERT INTO productvariantattributes (variantid, attributevalueid)
               VALUES ($1, $2)
               ON CONFLICT (variantid, attributevalueid) DO NOTHING`,
              [variant_id, Number(attributeValueId)]
            );
          }
        }
      }
    }

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

    // Block deletion if variant is referenced in inventories
    const invCountRes = await query('SELECT COUNT(1) AS cnt FROM inventories WHERE variantid = $1', [variant_id]);
    const invCount = Number(invCountRes.rows?.[0]?.cnt || 0);
    if (invCount > 0) {
      return NextResponse.json({
        ok: false,
        error: 'Cannot delete: variant is referenced by inventories',
        details: `There are ${invCount} inventory record(s) using this variant.`
      }, { status: 409 });
    }

    await query(`DELETE FROM productvariants WHERE variantid = $1`, [variant_id]);
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    const message = error?.message || 'Unknown error';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
