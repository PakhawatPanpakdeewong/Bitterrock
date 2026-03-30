import { NextRequest, NextResponse } from 'next/server';
import { query } from '../../../database/connection';
import { forbidStaffApi } from '@/lib/staff-api-guard';
import { getCurrentUser, isAdmin } from '@/lib/auth';

/** ไม่แคช — ตัวเลขต้องตรงกับฐานข้อมูลล่าสุด */
export const dynamic = 'force-dynamic';

type DailySummary = {
  summary_date: string;
  total_revenue: number;
  total_quantity: number;
};

type TopProduct = {
  product_id: number;
  product_name_th: string;
  product_name_en: string | null;
  total_revenue: number;
  total_quantity: number;
};

type TopProductProfit = TopProduct & { total_profit: number };

const TZ_STORE = 'Asia/Bangkok';

export async function GET(_req: NextRequest) {
  try {
    const denied = await forbidStaffApi();
    if (denied) return denied;
    const user = await getCurrentUser();
    const role = String(user?.StaffRole ?? '').toLowerCase();
    const canViewProfitDeepDive = !!user && (isAdmin(user) || role === 'manager');

    /** ยอดรวมจากออเดอร์จริง (ไม่ใช่ตาราง salessummary) */
    const totalsRes = await query(
      `SELECT 
         COALESCE((SELECT SUM(o.totalamount) FROM orders o WHERE o.orderstatus <> 'cancelled'), 0)::float8 AS total_revenue,
         COALESCE((
           SELECT SUM(oi.quantityordered) 
           FROM order_items oi 
           JOIN orders o ON o.orderid = oi.orderid 
           WHERE o.orderstatus <> 'cancelled'
         ), 0)::float8 AS total_quantity,
         COALESCE((
           SELECT COUNT(DISTINCT (timezone($1, o.orderdate))::date) 
           FROM orders o 
           WHERE o.orderstatus <> 'cancelled'
         ), 0)::int AS summary_days`,
      [TZ_STORE]
    );

    const dailyRes = await query(
      `SELECT 
         (timezone($1, o.orderdate))::date AS summary_date,
         COALESCE(SUM(oi.totalprice), 0)::float8 AS total_revenue,
         COALESCE(SUM(oi.quantityordered), 0)::float8 AS total_quantity
       FROM order_items oi
       JOIN orders o ON o.orderid = oi.orderid
       WHERE o.orderstatus <> 'cancelled'
       GROUP BY (timezone($1, o.orderdate))::date
       ORDER BY summary_date`,
      [TZ_STORE]
    );

    const [
      topProductsRes,
      topByRevenueRes,
      topByProfitRes,
      totalAvailRes,
      profitOverallRes,
      profitByProductRes,
      profitByCategoryRes,
      currentMonthPeriodRes,
      topProductsThisMonthRes,
      topCategoriesThisMonthRes,
    ] = await Promise.all([
      query(
        `SELECT 
           p.productid AS product_id,
           p.productnameth AS product_name_th,
           p.productnameen AS product_name_en,
           COALESCE(SUM(oi.totalprice), 0)::float8 AS total_revenue,
           COALESCE(SUM(oi.quantityordered), 0)::float8 AS total_quantity
         FROM order_items oi
         JOIN orders o ON o.orderid = oi.orderid
         JOIN inventories inv ON inv.inventoryid = oi.inventoryid
         JOIN productvariants pv ON pv.variantid = inv.variantid
         JOIN products p ON p.productid = pv.productid
         WHERE o.orderstatus <> 'cancelled'
         GROUP BY p.productid, p.productnameth, p.productnameen
         ORDER BY total_quantity DESC NULLS LAST, total_revenue DESC
         LIMIT 5`
      ),
      query(
        `SELECT 
           p.productid AS product_id,
           p.productnameth AS product_name_th,
           p.productnameen AS product_name_en,
           COALESCE(SUM(oi.totalprice), 0)::float8 AS total_revenue,
           COALESCE(SUM(oi.quantityordered), 0)::float8 AS total_quantity
         FROM order_items oi
         JOIN orders o ON o.orderid = oi.orderid
         JOIN inventories inv ON inv.inventoryid = oi.inventoryid
         JOIN productvariants pv ON pv.variantid = inv.variantid
         JOIN products p ON p.productid = pv.productid
         WHERE o.orderstatus <> 'cancelled'
         GROUP BY p.productid, p.productnameth, p.productnameen
         ORDER BY total_revenue DESC NULLS LAST, total_quantity DESC
         LIMIT 5`
      ),
      query(
        `SELECT 
           p.productid AS product_id,
           p.productnameth AS product_name_th,
           p.productnameen AS product_name_en,
           COALESCE(SUM(oi.quantityordered * (oi.unitprice - COALESCE(pv.cost, 0))), 0)::float8 AS total_profit,
           COALESCE(SUM(oi.totalprice), 0)::float8 AS total_revenue,
           COALESCE(SUM(oi.quantityordered), 0)::float8 AS total_quantity
         FROM order_items oi
         JOIN orders o ON o.orderid = oi.orderid
         JOIN inventories inv ON inv.inventoryid = oi.inventoryid
         JOIN productvariants pv ON pv.variantid = inv.variantid
         JOIN products p ON p.productid = pv.productid
         WHERE o.orderstatus <> 'cancelled'
         GROUP BY p.productid, p.productnameth, p.productnameen
         ORDER BY total_profit DESC NULLS LAST, total_revenue DESC
         LIMIT 5`
      ),
      query(`SELECT COALESCE(SUM(i.availablequantity), 0)::float8 AS total_available FROM inventories i`),
      query(
        `SELECT 
           COALESCE(SUM(oi.totalprice), 0)::float8 AS revenue,
           COALESCE(SUM(oi.quantityordered * COALESCE(pv.cost, 0)), 0)::float8 AS cogs
         FROM order_items oi
         JOIN orders o ON o.orderid = oi.orderid
         JOIN inventories inv ON inv.inventoryid = oi.inventoryid
         JOIN productvariants pv ON pv.variantid = inv.variantid
         WHERE o.orderstatus <> 'cancelled'`
      ),
      query(
        `SELECT 
           p.productid AS product_id,
           p.productnameth AS product_name_th,
           p.productnameen AS product_name_en,
           COALESCE(SUM(oi.totalprice), 0)::float8 AS revenue,
           COALESCE(SUM(oi.quantityordered * COALESCE(pv.cost, 0)), 0)::float8 AS cogs,
           COALESCE(SUM(oi.quantityordered), 0)::float8 AS total_quantity
         FROM order_items oi
         JOIN orders o ON o.orderid = oi.orderid
         JOIN inventories inv ON inv.inventoryid = oi.inventoryid
         JOIN productvariants pv ON pv.variantid = inv.variantid
         JOIN products p ON p.productid = pv.productid
         WHERE o.orderstatus <> 'cancelled'
         GROUP BY p.productid, p.productnameth, p.productnameen
         ORDER BY COALESCE(SUM(oi.totalprice), 0) - COALESCE(SUM(oi.quantityordered * COALESCE(pv.cost, 0)), 0) DESC NULLS LAST
         LIMIT 15`
      ),
      query(
        `SELECT 
           COALESCE(c.categoryid, -1)::int AS category_id,
           COALESCE(c.categorynameth, 'ไม่ระบุหมวดหมู่') AS category_name_th,
           COALESCE(SUM(oi.totalprice), 0)::float8 AS revenue,
           COALESCE(SUM(oi.quantityordered * COALESCE(pv.cost, 0)), 0)::float8 AS cogs
         FROM order_items oi
         JOIN orders o ON o.orderid = oi.orderid
         JOIN inventories inv ON inv.inventoryid = oi.inventoryid
         JOIN productvariants pv ON pv.variantid = inv.variantid
         JOIN products p ON p.productid = pv.productid
         LEFT JOIN subcategories sc ON sc.subcategoryid = p.subcategoryid
         LEFT JOIN categories c ON c.categoryid = sc.categoryid
         WHERE o.orderstatus <> 'cancelled'
         GROUP BY COALESCE(c.categoryid, -1), COALESCE(c.categorynameth, 'ไม่ระบุหมวดหมู่')
         ORDER BY COALESCE(SUM(oi.totalprice), 0) - COALESCE(SUM(oi.quantityordered * COALESCE(pv.cost, 0)), 0) DESC NULLS LAST`
      ),
      query(
        `SELECT (date_trunc('month', timezone($1, now())))::text AS month_start`,
        [TZ_STORE]
      ),
      query(
        `SELECT 
           p.productid AS product_id,
           p.productnameth AS product_name_th,
           p.productnameen AS product_name_en,
           COALESCE(SUM(oi.totalprice), 0)::float8 AS total_revenue,
           COALESCE(SUM(oi.quantityordered), 0)::float8 AS total_quantity
         FROM order_items oi
         JOIN orders o ON o.orderid = oi.orderid
         JOIN inventories inv ON inv.inventoryid = oi.inventoryid
         JOIN productvariants pv ON pv.variantid = inv.variantid
         JOIN products p ON p.productid = pv.productid
         WHERE o.orderstatus <> 'cancelled'
           AND (timezone($1, o.orderdate))::date >= (date_trunc('month', timezone($1, now())))::date
           AND (timezone($1, o.orderdate))::date < (date_trunc('month', timezone($1, now())) + interval '1 month')::date
         GROUP BY p.productid, p.productnameth, p.productnameen
         ORDER BY total_quantity DESC NULLS LAST, total_revenue DESC
         LIMIT 5`,
        [TZ_STORE]
      ),
      query(
        `SELECT 
           COALESCE(c.categoryid, -1)::int AS category_id,
           COALESCE(c.categorynameth, 'ไม่ระบุหมวดหมู่') AS category_name_th,
           COALESCE(SUM(oi.totalprice), 0)::float8 AS total_revenue,
           COALESCE(SUM(oi.quantityordered), 0)::float8 AS total_quantity
         FROM order_items oi
         JOIN orders o ON o.orderid = oi.orderid
         JOIN inventories inv ON inv.inventoryid = oi.inventoryid
         JOIN productvariants pv ON pv.variantid = inv.variantid
         JOIN products p ON p.productid = pv.productid
         LEFT JOIN subcategories sc ON sc.subcategoryid = p.subcategoryid
         LEFT JOIN categories c ON c.categoryid = sc.categoryid
         WHERE o.orderstatus <> 'cancelled'
           AND (timezone($1, o.orderdate))::date >= (date_trunc('month', timezone($1, now())))::date
           AND (timezone($1, o.orderdate))::date < (date_trunc('month', timezone($1, now())) + interval '1 month')::date
         GROUP BY COALESCE(c.categoryid, -1), COALESCE(c.categorynameth, 'ไม่ระบุหมวดหมู่')
         ORDER BY COALESCE(SUM(oi.totalprice), 0) DESC NULLS LAST, COALESCE(SUM(oi.quantityordered), 0) DESC NULLS LAST
         LIMIT 5`,
        [TZ_STORE]
      ),
    ]);

    const totalsRow = totalsRes.rows[0] || {
      total_revenue: 0,
      total_quantity: 0,
      summary_days: 0,
    };

    const daily: DailySummary[] = dailyRes.rows.map((row: any) => ({
      summary_date: row.summary_date,
      total_revenue: Number(row.total_revenue) || 0,
      total_quantity: Number(row.total_quantity) || 0,
    }));

    const mapTop = (row: any): TopProduct => ({
      product_id: row.product_id,
      product_name_th: row.product_name_th,
      product_name_en: row.product_name_en,
      total_revenue: Number(row.total_revenue) || 0,
      total_quantity: Number(row.total_quantity) || 0,
    });

    const topProducts: TopProduct[] = topProductsRes.rows.map(mapTop);
    const topProductsByRevenue: TopProduct[] = topByRevenueRes.rows.map(mapTop);
    const topProductsByProfit: TopProductProfit[] = topByProfitRes.rows.map((row: any) => ({
      ...mapTop(row),
      total_profit: Number(row.total_profit) || 0,
    }));

    const monthStartStr = String(currentMonthPeriodRes.rows[0]?.month_start ?? '').trim();
    const monthLabelTh = monthStartStr
      ? new Date(`${monthStartStr}T12:00:00+07:00`).toLocaleDateString('th-TH', {
          month: 'long',
          year: 'numeric',
        })
      : '';

    const topProductsThisMonth: TopProduct[] = topProductsThisMonthRes.rows.map(mapTop);
    const topCategoriesThisMonth = topCategoriesThisMonthRes.rows.map((row: any) => ({
      category_id: row.category_id,
      category_name_th: row.category_name_th,
      total_revenue: Number(row.total_revenue) || 0,
      total_quantity: Number(row.total_quantity) || 0,
    }));

    const totalAvailableUnits = Number(totalAvailRes.rows[0]?.total_available) || 0;

    const po = profitOverallRes.rows[0] as { revenue?: string; cogs?: string } | undefined;
    const lineRevenue = Number(po?.revenue) || 0;
    const lineCogs = Number(po?.cogs) || 0;
    const grossProfit = lineRevenue - lineCogs;
    /** ยังไม่มีตารางค่าใช้จ่ายดำเนินงาน — กำไรสุทธิ = กำไรขั้นต้น */
    const netProfit = grossProfit;

    const marginPct = (rev: number, gp: number) =>
      rev > 0 ? Math.round((gp / rev) * 1000) / 10 : 0;

    const profitByProduct = profitByProductRes.rows.map((row: any) => {
      const revenue = Number(row.revenue) || 0;
      const cogs = Number(row.cogs) || 0;
      const gross = revenue - cogs;
      return {
        product_id: row.product_id,
        product_name_th: row.product_name_th,
        product_name_en: row.product_name_en,
        revenue,
        cogs,
        gross_profit: gross,
        margin_pct: marginPct(revenue, gross),
        total_quantity: Number(row.total_quantity) || 0,
      };
    });

    const profitByCategory = profitByCategoryRes.rows.map((row: any) => {
      const revenue = Number(row.revenue) || 0;
      const cogs = Number(row.cogs) || 0;
      const gross = revenue - cogs;
      return {
        category_id: row.category_id,
        category_name_th: row.category_name_th,
        revenue,
        cogs,
        gross_profit: gross,
        margin_pct: marginPct(revenue, gross),
      };
    });

    const [
      dailyProfitRes,
      monthlySalesRes,
      salesSurpriseRes,
      lowMarginAlertRes,
      stagnantRes,
    ] = await Promise.all([
      query(
        `SELECT 
           (timezone($1, o.orderdate))::date AS summary_date,
           COALESCE(SUM(oi.totalprice), 0)::float8 - COALESCE(SUM(oi.quantityordered * COALESCE(pv.cost, 0)), 0)::float8 AS gross_profit
         FROM order_items oi
         JOIN orders o ON o.orderid = oi.orderid
         JOIN inventories inv ON inv.inventoryid = oi.inventoryid
         JOIN productvariants pv ON pv.variantid = inv.variantid
         WHERE o.orderstatus <> 'cancelled'
         GROUP BY (timezone($1, o.orderdate))::date
         ORDER BY summary_date`,
        [TZ_STORE]
      ),
      query(
        `SELECT 
           date_trunc('month', timezone($1, o.orderdate))::date AS month_start,
           COALESCE(SUM(oi.totalprice), 0)::float8 AS total_revenue
         FROM order_items oi
         JOIN orders o ON o.orderid = oi.orderid
         WHERE o.orderstatus <> 'cancelled'
         GROUP BY date_trunc('month', timezone($1, o.orderdate))::date
         ORDER BY month_start DESC
         LIMIT 24`,
        [TZ_STORE]
      ),
      query(
        `WITH cur30 AS (
           SELECT p.productid, SUM(oi.totalprice)::float8 AS rev
           FROM order_items oi
           JOIN orders o ON o.orderid = oi.orderid
           JOIN inventories inv ON inv.inventoryid = oi.inventoryid
           JOIN productvariants pv ON pv.variantid = inv.variantid
           JOIN products p ON p.productid = pv.productid
           WHERE o.orderstatus <> 'cancelled'
             AND (timezone($1, o.orderdate))::date >= (timezone($1, now()))::date - INTERVAL '30 days'
           GROUP BY p.productid
         ),
         prev30 AS (
           SELECT p.productid, SUM(oi.totalprice)::float8 AS rev
           FROM order_items oi
           JOIN orders o ON o.orderid = oi.orderid
           JOIN inventories inv ON inv.inventoryid = oi.inventoryid
           JOIN productvariants pv ON pv.variantid = inv.variantid
           JOIN products p ON p.productid = pv.productid
           WHERE o.orderstatus <> 'cancelled'
             AND (timezone($1, o.orderdate))::date >= (timezone($1, now()))::date - INTERVAL '60 days'
             AND (timezone($1, o.orderdate))::date < (timezone($1, now()))::date - INTERVAL '30 days'
           GROUP BY p.productid
         )
         SELECT 
           c.productid AS product_id,
           p.productnameth AS product_name_th,
           c.rev AS revenue_30d,
           COALESCE(pr.rev, 0)::float8 AS revenue_prev_30d
         FROM cur30 c
         JOIN products p ON p.productid = c.productid
         LEFT JOIN prev30 pr ON pr.productid = c.productid
         WHERE c.rev >= COALESCE(pr.rev, 0) * 1.35 + 200
           AND c.rev > 800
           AND COALESCE(pr.rev, 0) >= 150
         ORDER BY c.rev DESC
         LIMIT 8`,
        [TZ_STORE]
      ),
      query(
        `SELECT 
           p.productid AS product_id,
           p.productnameth AS product_name_th,
           COALESCE(SUM(oi.totalprice), 0)::float8 AS revenue,
           COALESCE(SUM(oi.quantityordered * COALESCE(pv.cost, 0)), 0)::float8 AS cogs
         FROM order_items oi
         JOIN orders o ON o.orderid = oi.orderid
         JOIN inventories inv ON inv.inventoryid = oi.inventoryid
         JOIN productvariants pv ON pv.variantid = inv.variantid
         JOIN products p ON p.productid = pv.productid
         WHERE o.orderstatus <> 'cancelled'
         GROUP BY p.productid, p.productnameth
         HAVING COALESCE(SUM(oi.totalprice), 0) > 1500
           AND COALESCE(SUM(oi.totalprice), 0) > 0
           AND (COALESCE(SUM(oi.totalprice), 0) - COALESCE(SUM(oi.quantityordered * COALESCE(pv.cost, 0)), 0))
             / COALESCE(SUM(oi.totalprice), 0) < 0.12
         ORDER BY (COALESCE(SUM(oi.totalprice), 0) - COALESCE(SUM(oi.quantityordered * COALESCE(pv.cost, 0)), 0))
           / NULLIF(COALESCE(SUM(oi.totalprice), 0), 0) ASC
         LIMIT 10`
      ),
      query(
        `WITH inv_agg AS (
           SELECT i.variantid, SUM(i.availablequantity)::bigint AS available_quantity
           FROM inventories i
           GROUP BY i.variantid
         ),
         sold AS (
           SELECT inv.variantid, SUM(oi.quantityordered)::bigint AS sold_90d
           FROM order_items oi
           JOIN orders o ON o.orderid = oi.orderid
           JOIN inventories inv ON inv.inventoryid = oi.inventoryid
           WHERE o.orderstatus <> 'cancelled'
             AND (timezone($1, o.orderdate)) >= (timezone($1, now())) - INTERVAL '90 days'
           GROUP BY inv.variantid
         )
         SELECT 
           pv.variantid AS variant_id,
           p.productnameth AS product_name_th,
           pv.sku AS variant_sku,
           inv_agg.available_quantity::int AS available_quantity,
           COALESCE(sold.sold_90d, 0)::int AS sold_90d
         FROM inv_agg
         JOIN productvariants pv ON pv.variantid = inv_agg.variantid
         JOIN products p ON p.productid = pv.productid
         LEFT JOIN sold ON sold.variantid = inv_agg.variantid
         WHERE inv_agg.available_quantity >= 8
           AND COALESCE(sold.sold_90d, 0) = 0
         ORDER BY inv_agg.available_quantity DESC
         LIMIT 12`,
        [TZ_STORE]
      ),
    ]);

    const dailyProfit = dailyProfitRes.rows.map((row: any) => ({
      summary_date: row.summary_date,
      gross_profit: Number(row.gross_profit) || 0,
    }));

    const monthlySalesAsc = [...monthlySalesRes.rows]
      .map((row: any) => ({
        month_start: row.month_start,
        total_revenue: Number(row.total_revenue) || 0,
      }))
      .sort((a, b) => String(a.month_start).localeCompare(String(b.month_start)));

    const salesSurprise = salesSurpriseRes.rows.map((row: any) => {
      const cur = Number(row.revenue_30d) || 0;
      const prev = Number(row.revenue_prev_30d) || 0;
      const growthPct = prev > 0 ? Math.round(((cur - prev) / prev) * 1000) / 10 : null;
      return {
        product_id: row.product_id,
        product_name_th: row.product_name_th,
        revenue_30d: cur,
        revenue_prev_30d: prev,
        growth_pct: growthPct,
      };
    });

    const lowMarginAlerts = lowMarginAlertRes.rows.map((row: any) => {
      const revenue = Number(row.revenue) || 0;
      const cogs = Number(row.cogs) || 0;
      const gp = revenue - cogs;
      return {
        product_id: row.product_id,
        product_name_th: row.product_name_th,
        revenue,
        cogs,
        gross_profit: gp,
        margin_pct: marginPct(revenue, gp),
      };
    });

    const stagnantAlerts = stagnantRes.rows.map((row: any) => ({
      variant_id: row.variant_id,
      product_name_th: row.product_name_th,
      variant_sku: row.variant_sku ?? null,
      available_quantity: Number(row.available_quantity) || 0,
      sold_90d: Number(row.sold_90d) || 0,
    }));

    return NextResponse.json({
      ok: true,
      totals: {
        total_revenue: Number(totalsRow.total_revenue) || 0,
        total_quantity: Number(totalsRow.total_quantity) || 0,
        summary_days: Number(totalsRow.summary_days) || 0,
      },
      daily,
      topProducts,
      topProductsByRevenue,
      topProductsByProfit,
      this_month: {
        label_th: monthLabelTh,
        month_start: monthStartStr || null,
        top_products: topProductsThisMonth,
        top_categories: topCategoriesThisMonth,
      },
      inventory: {
        total_available_units: totalAvailableUnits,
      },
      ...(canViewProfitDeepDive
        ? {
            profitDeepDive: {
              summary: {
                /** รายได้จากบรรทัดออเดอร์ (สอดคล้องกับต้นทุน/กำไร) */
                line_revenue: lineRevenue,
                cogs: lineCogs,
                gross_profit: grossProfit,
                net_profit: netProfit,
                gross_margin_pct: marginPct(lineRevenue, grossProfit),
                net_margin_pct: marginPct(lineRevenue, netProfit),
                note:
                  'กำไรสุทธิในฐานะนี้เท่ากับกำไรขั้นต้น — ยังไม่หักค่าใช้จ่ายดำเนินงานอื่น (การตลาด ค่าส่ง โอเพเรชั่น ฯลฯ)',
              },
              by_product: profitByProduct,
              by_category: profitByCategory,
            },
          }
        : {}),
      charts: {
        daily_profit: dailyProfit,
        monthly_sales: monthlySalesAsc,
      },
      alerts: {
        sales_surprise: salesSurprise,
        low_margin: lowMarginAlerts,
        stagnant: stagnantAlerts,
        rules: {
          surprise_min_prev_revenue: 150,
          surprise_growth_factor: 1.35,
          low_margin_pct: 12,
          min_revenue_for_low_margin_alert: 1500,
          stagnant_min_stock: 8,
          stagnant_days: 90,
        },
      },
    });
  } catch (error: any) {
    console.error('Error fetching sales summary:', error);
    const message = error?.message || 'Unknown error';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

