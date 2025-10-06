import { NextRequest, NextResponse } from 'next/server';
import { query } from '../../../database/connection';

type DbProduct = {
  product_id: number;
  sub_category_id: string | null;
  product_name: string;
  description: string | null;
  base_sku: string | null;
  base_price: string; // numeric comes back as string from pg
  sub_category_name: string | null;
};

type DbVariant = {
  variant_id: number;
  product_id: number;
  variant_name: string;
  variant_value: string;
  color: string;
  size: string;
  sku: string | null;
  price: string; // numeric
  stock_quantity: number | null;
  image_url: string | null;
  is_active: boolean | null;
};

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit') || 30)));
    const offset = Math.max(0, Number(searchParams.get('offset') || 0));

    // Fetch products with subcategory name
    const productsRes = await query(
      `SELECT p.product_id, p.sub_category_id, p.product_name, p.description, p.base_sku, p.base_price,
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

    // Fetch variants for these products
    const variantsRes = await query(
      `SELECT variant_id, product_id, variant_name, variant_value, color, size, sku, price, stock_quantity, image_url, is_active
       FROM product_variants
       WHERE product_id = ANY($1::int[]) 
       ORDER BY product_id, variant_id`,
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
      product_name: p.product_name,
      description: p.description,
      base_sku: p.base_sku,
      base_price: Number(p.base_price),
      variants: (productIdToVariants[p.product_id] || []).map((v) => ({
        variant_id: v.variant_id,
        variant_name: v.variant_name,
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


