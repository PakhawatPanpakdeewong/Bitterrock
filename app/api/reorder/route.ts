import { NextRequest, NextResponse } from 'next/server';
import { query } from '../../../database/connection';

const DEFAULT_PARAMS = {
  daily_demand: 5,
  lead_time_days: 7,
  safety_stock: 10,
  ordering_cost: 100,
  holding_cost_percent: 10,
};

function calcROP(dailyDemand: number, leadTime: number, safetyStock: number): number {
  return Math.ceil(dailyDemand * leadTime + safetyStock);
}

function calcEOQ(
  dailyDemand: number,
  orderingCost: number,
  holdingCostPerUnit: number
): number {
  const annualDemand = dailyDemand * 365;
  if (holdingCostPerUnit <= 0) return Math.ceil(annualDemand);
  const eoq = Math.sqrt((2 * annualDemand * orderingCost) / holdingCostPerUnit);
  return Math.ceil(Math.max(1, eoq));
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const warehouseId = searchParams.get('warehouse_id');
    const limit = Math.min(1000, Math.max(1, Number(searchParams.get('limit') || 1000)));

    const params: unknown[] = [];
    let whereConditions: string[] = [];

    if (warehouseId) {
      whereConditions.push(`i.warehouseid = $${params.length + 1}`);
      params.push(Number(warehouseId));
    }
    const whereSql = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
    params.push(limit);

    const res = await query(
      `SELECT 
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
        w.warehousename as warehouse_name,
        STRING_AGG(DISTINCT av.attributevalueth, ', ' ORDER BY av.attributevalueth) as attribute_value_th,
        COALESCE(vrp.dailydemand, 5) as daily_demand,
        COALESCE(vrp.leadtimedays, 7) as lead_time_days,
        COALESCE(vrp.safetystock, 10) as safety_stock,
        COALESCE(vrp.orderingcost, 100) as ordering_cost,
        COALESCE(vrp.holdingcostpercent, 10) as holding_cost_percent,
        (vrp.variantid IS NOT NULL) as has_custom_params
      FROM inventories i
      LEFT JOIN productvariants pv ON pv.variantid = i.variantid
      LEFT JOIN products p ON p.productid = pv.productid
      LEFT JOIN subcategories sc ON sc.subcategoryid = p.subcategoryid
      LEFT JOIN productvariantattributes pva ON pva.variantid = pv.variantid
      LEFT JOIN attributevalues av ON av.attributevalueid = pva.attributevalueid
      JOIN warehouses w ON w.warehouseid = i.warehouseid
      LEFT JOIN variantreorderparams vrp ON vrp.variantid = i.variantid AND vrp.warehouseid = i.warehouseid
      ${whereSql}
      GROUP BY i.inventoryid, i.variantid, i.warehouseid, i.stockquantity, i.reservedquantity,
               i.availablequantity, i.expireddate, p.productid, p.productnameth, p.productnameen,
               sc.subcategorynameth, pv.sku, pv.price, w.warehousename,
               vrp.dailydemand, vrp.leadtimedays, vrp.safetystock, vrp.orderingcost, vrp.holdingcostpercent,
               (vrp.variantid IS NOT NULL)
      ORDER BY i.inventoryid DESC
      LIMIT $${params.length}`,
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
      warehouse_name: string;
      attribute_value_th: string | null;
      daily_demand: number;
      lead_time_days: number;
      safety_stock: number;
      ordering_cost: number;
      holding_cost_percent: number;
      has_custom_params: boolean;
    }>;

    const items = rows.map((row) => {
      const price = row.variant_price ? Number(row.variant_price) : null;
      const dd = Number(row.daily_demand) || DEFAULT_PARAMS.daily_demand;
      const lt = Number(row.lead_time_days) || DEFAULT_PARAMS.lead_time_days;
      const ss = Number(row.safety_stock) || DEFAULT_PARAMS.safety_stock;
      const oc = Number(row.ordering_cost) || DEFAULT_PARAMS.ordering_cost;
      const hcp = Number(row.holding_cost_percent) || DEFAULT_PARAMS.holding_cost_percent;

      const rop = calcROP(dd, lt, ss);
      const holdingCostPerUnit =
        (price ?? 0) > 0 ? (price ?? 0) * (hcp / 100) : oc * 0.1;
      const eoq = calcEOQ(dd, oc, holdingCostPerUnit);
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
        warehouse_name: row.warehouse_name,
        attribute_value_th: row.attribute_value_th,
        reorder_params: {
          daily_demand: dd,
          lead_time_days: lt,
          safety_stock: ss,
          ordering_cost: oc,
          holding_cost_percent: hcp,
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
