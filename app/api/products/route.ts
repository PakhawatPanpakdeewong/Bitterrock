import { NextRequest, NextResponse } from 'next/server';
import { query } from '../../../database/connection';

type DbProduct = {
  product_id: number;
  brand_id: number | null;
  sub_category_id: number | null;
  product_name_th: string;
  product_name_en: string;
  description: string | null;
  sub_category_name: string | null;
  brand_name_th: string | null;
  brand_name_en: string | null;
  brand_code: string | null;
};

type DbVariant = {
  variant_id: number;
  product_id: number;
  attribute_name_th: string | null;
  attribute_name_en: string | null;
  attribute_value_th: string | null;
  attribute_value_en: string | null;
  sku: string | null;
  price: string; // numeric
  image_url: string | null;
  is_active: boolean | null;
};

export const revalidate = 60; // Revalidate every 60 seconds

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
      `SELECT 
    p.productid as product_id,
    p.brandid as brand_id,
    p.subcategoryid as sub_category_id,
    p.productnameth as product_name_th,
    p.productnameen as product_name_en,
    p.description,
    sc.subcategorynameth as sub_category_name,
    b.brandnameth as brand_name_th,
    b.brandnameen as brand_name_en,
    b.brandcode as brand_code,
    pv.variantid as variant_id,
    pv.sku as variant_sku,
    pv.price as variant_price,
    pv.isactive as variant_is_active
   FROM products p
   LEFT JOIN subcategories sc ON sc.subcategoryid = p.subcategoryid
   LEFT JOIN brands b ON b.brandid = p.brandid
   LEFT JOIN productvariants pv ON pv.productid = p.productid
   ${whereSql}
   ORDER BY p.productid, pv.variantid
   LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    const products = productsRes.rows as unknown as DbProduct[];
    if (products.length === 0) {
      return NextResponse.json({ ok: true, items: [] });
    }

    // Deduplicate products by product_id (LEFT JOIN with variants creates duplicates)
    const uniqueProductsMap = new Map<number, DbProduct>();
    for (const p of products) {
      if (!uniqueProductsMap.has(p.product_id)) {
        uniqueProductsMap.set(p.product_id, p);
      }
    }
    const uniqueProducts = Array.from(uniqueProductsMap.values());

    const productIds = uniqueProducts.map((p) => p.product_id);

    // Fetch variants for these products; join attribute values and attributes for labels - using lowercase column names without underscores
    const variantsRes = await query(
      `SELECT pv.variantid as variant_id, pv.productid as product_id, pv.sku, pv.price, NULL as image_url, pv.isactive as is_active,
              STRING_AGG(DISTINCT av.attributevalueth, ', ' ORDER BY av.attributevalueth) as attribute_value_th,
              STRING_AGG(DISTINCT av.attributevalueen, ', ' ORDER BY av.attributevalueen) as attribute_value_en,
              STRING_AGG(DISTINCT a.attributenameth, ', ' ORDER BY a.attributenameth) as attribute_name_th,
              STRING_AGG(DISTINCT a.attributenameen, ', ' ORDER BY a.attributenameen) as attribute_name_en,
              STRING_AGG(DISTINCT av.attributevalueid::text, ', ' ORDER BY av.attributevalueid::text) as attribute_value_ids,
              STRING_AGG(DISTINCT a.attributeid::text, ', ' ORDER BY a.attributeid::text) as attribute_ids
       FROM productvariants pv
       LEFT JOIN productvariantattributes pva ON pva.variantid = pv.variantid
       LEFT JOIN attributevalues av ON av.attributevalueid = pva.attributevalueid
       LEFT JOIN attributes a ON a.attributeid = av.attributeid
       WHERE pv.productid = ANY($1::int[])
       GROUP BY pv.variantid, pv.productid, pv.sku, pv.price, pv.isactive
       ORDER BY pv.productid, pv.variantid`,
      [productIds]
    );

    const productIdToVariants: Record<number, DbVariant[]> = {};
    for (const v of variantsRes.rows as unknown as DbVariant[]) {
      if (!productIdToVariants[v.product_id]) productIdToVariants[v.product_id] = [];
      productIdToVariants[v.product_id].push(v);
    }

    const items = uniqueProducts.map((p) => ({
      id: p.product_id,
      brand_id: p.brand_id,
      sub_category_id: p.sub_category_id,
      sub_categories_name: p.sub_category_name,
      brand_name_th: p.brand_name_th,
      brand_name_en: p.brand_name_en,
      brand_code: p.brand_code,
      product_name: p.product_name_th,
      product_name_th: p.product_name_th,
      product_name_en: p.product_name_en,
      description: p.description,
      variants: (productIdToVariants[p.product_id] || []).map((v) => ({
        variant_id: v.variant_id,
        variant_name: v.attribute_name_th && v.attribute_value_th 
          ? `${v.attribute_name_th}: ${v.attribute_value_th}` 
          : v.sku || `Variant ${v.variant_id}`,
        sku: v.sku,
        price: Number(v.price),
        image_url: v.image_url,
        is_active: v.is_active ?? true,
        attribute_value_ids: v.attribute_value_ids ? v.attribute_value_ids.split(', ').map(id => parseInt(id)).filter(id => !isNaN(id)) : [],
        attribute_ids: v.attribute_ids ? v.attribute_ids.split(', ').map(id => parseInt(id)).filter(id => !isNaN(id)) : [],
      })),
    }));

    return NextResponse.json({ ok: true, items }, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300'
      }
    });
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
      brand_id = null,
      product_name_th,
      product_name_en,
      description = null,
    } = body || {};

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

    // Convert brand_id to number or null
    let coercedBrandId: number | null = null;
    if (brand_id !== null && brand_id !== undefined && brand_id !== '') {
      const numValue = Number(brand_id);
      if (!Number.isNaN(numValue)) {
        coercedBrandId = numValue;
      } else {
        console.warn('⚠️ WARNING: brand_id is not a valid number:', brand_id);
        coercedBrandId = null;
      }
    }
    
    console.log('🔍 DEBUG: Sub Category ID in API:', {
      received: sub_category_id,
      type: typeof sub_category_id,
      coerced: coercedSubCategoryId,
      isNull: coercedSubCategoryId === null
    });
    console.log('🔍 DEBUG: Brand ID in API:', {
      received: brand_id,
      type: typeof brand_id,
      coerced: coercedBrandId,
      isNull: coercedBrandId === null
    });

    try {
      const insertValues = [coercedBrandId, coercedSubCategoryId, product_name_th, product_name_en, description];
      console.log('🔍 DEBUG: Insert values:', insertValues);
      const insertRes = await query(
        `INSERT INTO products (brandid, subcategoryid, productnameth, productnameen, description)
         VALUES ($1, $2, $3, $4, $5)
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
    };

    const updatable = {
      sub_category_id: body?.sub_category_id,
      product_name_th: body?.product_name_th,
      product_name_en: body?.product_name_en,
      description: body?.description,
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
