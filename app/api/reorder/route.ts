import { NextRequest, NextResponse } from 'next/server';
import { query } from '../../../database/connection';
import { calcROP, calcEOQ, calcSafetyStock } from '@/lib/reorder-calc';
import { hasVariantReorderMaxLeadColumn } from '@/lib/variant-reorder-schema';

const TZ_STORE = 'Asia/Bangkok';
/** จำนวนวันย้อนหลังสำหรับคำนวณยอดขายเฉลี่ย/สูงสุดต่อวัน */
const SALES_LOOKBACK_DAYS = 90;

const DEFAULT_PARAMS = {
  lead_time_days: 7,
  max_lead_time_days: 7,
  safety_stock: 10,
  ordering_cost: 100,
  holding_cost_percent: 10,
};

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const warehouseId = searchParams.get('warehouse_id');
    const limit = Math.min(1000, Math.max(1, Number(searchParams.get('limit') || 1000)));

    const params: unknown[] = [TZ_STORE, SALES_LOOKBACK_DAYS];
    const whereConditions: string[] = [];

    if (warehouseId) {
      whereConditions.push(`i.warehouseid = $${params.length + 1}`);
      params.push(Number(warehouseId));
    }
    const whereSql = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
    params.push(limit);
    const limitParamIndex = params.length;

    const hasMaxLeadCol = await hasVariantReorderMaxLeadColumn();
    const maxLeadSelect = hasMaxLeadCol
      ? 'COALESCE(vrp.maxleadtimedays, 7) as max_lead_time_days'
      : 'COALESCE(vrp.leadtimedays, 7) as max_lead_time_days';
    const vrpGroupByMax = hasMaxLeadCol ? 'vrp.maxleadtimedays,' : '';

    const res = await query(
      `WITH daily_sales AS (
        SELECT 
          inv.variantid AS variant_id,
          inv.warehouseid AS warehouse_id,
          (timezone($1, o.orderdate))::date AS sale_date,
          SUM(oi.quantityordered)::numeric AS qty
        FROM order_items oi
        JOIN orders o ON o.orderid = oi.orderid
        JOIN inventories inv ON inv.inventoryid = oi.inventoryid
        WHERE o.orderstatus <> 'cancelled'
          AND (timezone($1, o.orderdate))::date >= (timezone($1, now()))::date - ($2::integer)
        GROUP BY inv.variantid, inv.warehouseid, (timezone($1, o.orderdate))::date
      ),
      sales_agg AS (
        SELECT 
          variant_id,
          warehouse_id,
          SUM(qty)::float8 / NULLIF($2::float8, 0) AS avg_daily_sales,
          COALESCE(MAX(qty), 0)::float8 AS max_daily_sales,
          COALESCE(SUM(qty), 0)::float8 AS total_qty_period
        FROM daily_sales
        GROUP BY variant_id, warehouse_id
      )
      SELECT 
        i.inventoryid as inventory_id,
        i.variantid as variant_id,
        i.warehouseid as warehouse_id,
        i.stockquantity as stock_quantity,
        i.reservedquantity as reserved_quantity,
        i.availablequantity as available_quantity,
        i.expireddate as expired_date,
        p.productid as product_id,
        p.productnameth as product_name_th,
        p.productnameen as product_name_en,
        sc.subcategorynameth as sub_category_name,
        pv.sku as variant_sku,
        pv.price as variant_price,
        COALESCE(pv.cost, 0)::float8 as variant_cost,
        w.warehousename as warehouse_name,
        STRING_AGG(DISTINCT av.attributevalueth, ', ' ORDER BY av.attributevalueth) as attribute_value_th,
        COALESCE(vrp.leadtimedays, 7) as lead_time_days,
        ${maxLeadSelect},
        COALESCE(vrp.safetystock, 10) as safety_stock,
        vrp.orderingcost as ordering_cost_saved,
        COALESCE(vrp.holdingcostpercent, 10) as holding_cost_percent,
        (vrp.variantid IS NOT NULL) as has_custom_params,
        COALESCE(sa.avg_daily_sales, 0)::float8 as avg_daily_sales,
        COALESCE(sa.max_daily_sales, 0)::float8 as max_daily_sales,
        COALESCE(sa.total_qty_period, 0)::float8 as total_qty_period
      FROM inventories i
      LEFT JOIN productvariants pv ON pv.variantid = i.variantid
      LEFT JOIN products p ON p.productid = pv.productid
      LEFT JOIN subcategories sc ON sc.subcategoryid = p.subcategoryid
      LEFT JOIN productvariantattributes pva ON pva.variantid = pv.variantid
      LEFT JOIN attributevalues av ON av.attributevalueid = pva.attributevalueid
      JOIN warehouses w ON w.warehouseid = i.warehouseid
      LEFT JOIN variantreorderparams vrp ON vrp.variantid = i.variantid AND vrp.warehouseid = i.warehouseid
      LEFT JOIN sales_agg sa ON sa.variant_id = i.variantid AND sa.warehouse_id = i.warehouseid
      ${whereSql}
      GROUP BY i.inventoryid, i.variantid, i.warehouseid, i.stockquantity, i.reservedquantity,
               i.availablequantity, i.expireddate, p.productid, p.productnameth, p.productnameen,
               sc.subcategorynameth, pv.sku, pv.price, pv.cost, w.warehousename,
               vrp.leadtimedays, ${vrpGroupByMax} vrp.safetystock, vrp.orderingcost, vrp.holdingcostpercent,
               (vrp.variantid IS NOT NULL),
               sa.avg_daily_sales, sa.max_daily_sales, sa.total_qty_period
      ORDER BY i.inventoryid DESC
      LIMIT $${limitParamIndex}`,
      params
    );

    const rows = res.rows as Array<{
      inventory_id: number;
      variant_id: number | null;
      warehouse_id: number;
      stock_quantity: number;
      reserved_quantity: number;
      available_quantity: number;
      expired_date: string | null;
      product_id: number;
      product_name_th: string;
      product_name_en: string;
      sub_category_name: string | null;
      variant_sku: string | null;
      variant_price: string | null;
      variant_cost: number | string | null;
      warehouse_name: string;
      attribute_value_th: string | null;
      lead_time_days: number;
      max_lead_time_days: number;
      safety_stock: number;
      ordering_cost_saved: number | null;
      holding_cost_percent: number;
      has_custom_params: boolean;
      avg_daily_sales: number;
      max_daily_sales: number;
      total_qty_period: number;
    }>;

    const items = rows.map((row) => {
      const price = row.variant_price ? Number(row.variant_price) : null;
      const avgDaily = Number(row.avg_daily_sales) || 0;
      const maxDaily = Number(row.max_daily_sales) || 0;
      const totalQtyPeriod = Number(row.total_qty_period) || 0;
      const avgLt = Number(row.lead_time_days) || DEFAULT_PARAMS.lead_time_days;
      const maxLt = Number(row.max_lead_time_days) || DEFAULT_PARAMS.max_lead_time_days;
      const storedSafety = Number(row.safety_stock) || DEFAULT_PARAMS.safety_stock;
      const costPerUnit = Number(row.variant_cost) || 0;
      const stockQty = Number(row.stock_quantity) || 0;
      const computedOrderingCost =
        Math.round(costPerUnit * stockQty * 100) / 100;
      const hasVrp = Boolean(row.has_custom_params);
      const oc = hasVrp
        ? row.ordering_cost_saved != null && !Number.isNaN(Number(row.ordering_cost_saved))
          ? Number(row.ordering_cost_saved)
          : computedOrderingCost > 0
            ? computedOrderingCost
            : DEFAULT_PARAMS.ordering_cost
        : computedOrderingCost > 0
          ? computedOrderingCost
          : DEFAULT_PARAMS.ordering_cost;
      const hcp = Number(row.holding_cost_percent) || DEFAULT_PARAMS.holding_cost_percent;

      const insufficientSales = totalQtyPeriod <= 0;
      const formulaSafety = calcSafetyStock(maxDaily, maxLt, avgDaily, avgLt);
      const safetyEffective = insufficientSales ? storedSafety : formulaSafety;

      const rop = calcROP(avgDaily, avgLt, safetyEffective);
      const holdingCostPerUnit =
        (price ?? 0) > 0 ? (price ?? 0) * (hcp / 100) : oc * 0.1;
      const eoq = calcEOQ(avgDaily, oc, holdingCostPerUnit);
      const needsReorder = row.available_quantity <= rop;
      const shortfall = Math.max(0, rop - row.available_quantity);
      const suggestedQty = needsReorder ? Math.max(eoq, shortfall) : 0;

      return {
        inventory_id: row.inventory_id,
        product_id: row.product_id,
        variant_id: row.variant_id,
        warehouse_id: row.warehouse_id,
        stock_quantity: row.stock_quantity,
        reserved_quantity: row.reserved_quantity,
        available_quantity: row.available_quantity,
        expired_date: row.expired_date,
        product_name_th: row.product_name_th,
        product_name_en: row.product_name_en,
        sub_category_name: row.sub_category_name,
        variant_sku: row.variant_sku,
        price,
        variant_cost: costPerUnit,
        warehouse_name: row.warehouse_name,
        attribute_value_th: row.attribute_value_th,
        sales_stats: {
          lookback_days: SALES_LOOKBACK_DAYS,
          avg_daily_sales: avgDaily,
          max_daily_sales: maxDaily,
          total_qty_period: totalQtyPeriod,
        },
        reorder_params: {
          lead_time_days: avgLt,
          max_lead_time_days: maxLt,
          safety_stock: storedSafety,
          ordering_cost: oc,
          holding_cost_percent: hcp,
        },
        safety_stock: {
          insufficient_sales_history: insufficientSales,
          formula_value: insufficientSales ? null : formulaSafety,
          effective: safetyEffective,
        },
        has_custom_params: Boolean(row.has_custom_params),
        rop,
        eoq,
        needs_reorder: needsReorder,
        suggested_order_qty: suggestedQty,
      };
    });

    return NextResponse.json({ ok: true, items });
  } catch (error: unknown) {
    console.error('Error fetching reorder data:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
