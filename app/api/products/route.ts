import { NextRequest, NextResponse } from 'next/server';
import { query } from '../../../database/connection';

type DbProduct = {
  product_id: number;
  sub_category_id: number | null;
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
    const categoryIdParam = searchParams.get('category_id');

    // Fetch products with optional filter by category (via subcategories.categoryid)
    const params: any[] = [];
    let whereSql = '';
    if (categoryIdParam) {
      whereSql = 'WHERE sc.categoryid = $1';
      params.push(Number(categoryIdParam));
    }

    // limit/offset are always last two params
    params.push(limit, offset);

    const productsRes = await query(
      `SELECT p.productid as product_id, p.subcategoryid as sub_category_id, p.productnameth as product_name_th, p.productnameen as product_name_en, p.description, p.basesku as base_sku, p.baseprice as base_price,
              sc.subcategorynameth as sub_category_name
       FROM products p
       LEFT JOIN subcategories sc ON sc.subcategoryid = p.subcategoryid
       ${whereSql}
       ORDER BY p.productid
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    const products = productsRes.rows as unknown as DbProduct[];
    if (products.length === 0) {
      return NextResponse.json({ ok: true, items: [] });
    }

    const productIds = products.map((p) => p.product_id);

    // Fetch variants for these products; join attribute values and attributes for labels - using lowercase column names without underscores
    const variantsRes = await query(
      `SELECT pv.variantid as variant_id, pv.productid as product_id, pv.attributevalueid as attribute_value_id, pv.sku, pv.price, NULL as image_url, pv.isactive as is_active,
              av.attributevalueth as attribute_value_th, av.attributevalueen as attribute_value_en,
              a.attributenameth as attribute_name_th, a.attributenameen as attribute_name_en
       FROM productvariants pv
       JOIN attributevalues av ON av.attributevalueid = pv.attributevalueid
       JOIN attributes a ON a.attributeid = av.attributeid
       WHERE pv.productid = ANY($1::int[])
       ORDER BY pv.productid, pv.variantid`,
      [productIds]
    );

    const productIdToVariants: Record<number, DbVariant[]> = {};
    for (const v of variantsRes.rows as unknown as DbVariant[]) {
      if (!productIdToVariants[v.product_id]) productIdToVariants[v.product_id] = [];
      productIdToVariants[v.product_id].push(v);
    }

    const items = products.map((p) => ({
      id: p.product_id,
      sub_category_id: p.sub_category_id,
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
    console.log('🔍 DEBUG: Received POST request body:', body);
    const {
      sub_category_id = null,
      product_name_th,
      product_name_en,
      description = null,
      base_sku = null,
      base_price,
    } = body || {};

    // COMMENTED OUT ALL VALIDATIONS FOR DEBUGGING
    // if (!product_name_th || !product_name_en) {
    //   return NextResponse.json({ ok: false, error: 'product_name_th and product_name_en are required' }, { status: 400 });
    // }
    // if (base_price === undefined || base_price === null || Number.isNaN(Number(base_price))) {
    //   return NextResponse.json({ ok: false, error: 'base_price is required and must be a number' }, { status: 400 });
    // }

    const coercedBasePrice = Number(base_price || 0);
    // if (coercedBasePrice < 0) {
    //   return NextResponse.json({ ok: false, error: 'base_price must be >= 0' }, { status: 400 });
    // }

    const trimmedSku = typeof base_sku === 'string' ? base_sku.trim() : base_sku;
    // if (trimmedSku && trimmedSku.length > 10) {
    //   return NextResponse.json({ ok: false, error: 'base_sku must be at most 10 characters' }, { status: 400 });
    // }

    // Convert sub_category_id to number or null
    let coercedSubCategoryId: number | null = null;
    if (sub_category_id !== null && sub_category_id !== undefined && sub_category_id !== '') {
      const numValue = Number(sub_category_id);
      if (!Number.isNaN(numValue)) {
        coercedSubCategoryId = numValue;
      } else {
        console.warn('⚠️ WARNING: sub_category_id is not a valid number:', sub_category_id);
        coercedSubCategoryId = null;
      }
    }
    
    console.log('🔍 DEBUG: Sub Category ID in API:', {
      received: sub_category_id,
      type: typeof sub_category_id,
      coerced: coercedSubCategoryId,
      isNull: coercedSubCategoryId === null
    });

    try {
      const insertValues = [coercedSubCategoryId, product_name_th, product_name_en, description, trimmedSku ?? null, coercedBasePrice];
      console.log('🔍 DEBUG: Insert values:', insertValues);
      const insertRes = await query(
        `INSERT INTO products (subcategoryid, productnameth, productnameen, description, basesku, baseprice)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING productid as product_id`,
        insertValues
      );

      const newId = insertRes.rows[0]?.product_id;
      console.log('✅ SUCCESS: Product inserted with ID:', newId);
      return NextResponse.json({ ok: true, id: newId });
    } catch (dbError: any) {
      console.error('❌ DATABASE ERROR:', dbError);
      console.error('❌ Error code:', dbError?.code);
      console.error('❌ Error message:', dbError?.message);
      console.error('❌ Error detail:', dbError?.detail);
      console.error('❌ Error constraint:', dbError?.constraint);
      console.error('❌ Full error:', JSON.stringify(dbError, null, 2));
      
      // Map common Postgres errors to friendly messages
      const code = dbError?.code;
      if (code === '23505') {
        return NextResponse.json({ 
          ok: false, 
          error: 'Duplicate value violates unique constraint (likely base_sku already exists)',
          detail: dbError?.detail || 'A product with this SKU may already exist'
        }, { status: 409 });
      }
      if (code === '23503') {
        // Foreign key constraint violation
        const constraint = dbError?.constraint || '';
        const detail = dbError?.detail || '';
        let errorMessage = 'Invalid sub_category_id (foreign key not found)';
        if (constraint.includes('subcategoryid') || detail.includes('subcategoryid')) {
          errorMessage = `Subcategory ID ${coercedSubCategoryId} does not exist in the database. Please select a valid subcategory.`;
        }
        return NextResponse.json({ 
          ok: false, 
          error: errorMessage,
          detail: detail,
          constraint: constraint,
          sub_category_id_attempted: coercedSubCategoryId
        }, { status: 400 });
      }
      if (code === '23514') {
        return NextResponse.json({ 
          ok: false, 
          error: 'Constraint violated (check your inputs, e.g., base_price must be >= 0)',
          detail: dbError?.detail || ''
        }, { status: 400 });
      }
      throw dbError;
    }
  } catch (error: any) {
    console.error('❌ GENERAL ERROR:', error);
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

    // Map frontend field names to database column names (lowercase without underscores)
    const fieldMapping: Record<string, string> = {
      sub_category_id: 'subcategoryid',
      product_name_th: 'productnameth',
      product_name_en: 'productnameen',
      description: 'description',
      base_sku: 'basesku',
      base_price: 'baseprice',
    };

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
        const dbColumnName = fieldMapping[key] || key;
        fields.push(`${dbColumnName} = $${idx++}`);
        values.push(value);
      }
    }

    if (fields.length === 0) {
      return NextResponse.json({ ok: false, error: 'No fields to update' }, { status: 400 });
    }

    values.push(product_id);
    const sql = `UPDATE products SET ${fields.join(', ')} WHERE productid = $${idx}`;
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

    await query(`DELETE FROM products WHERE productid = $1`, [product_id]);
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    const message = error?.message || 'Unknown error';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
