import { NextRequest, NextResponse } from 'next/server';
import { query } from '../../../database/connection';

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

export async function GET(_req: NextRequest) {
  try {
    const totalsRes = await query(
      `SELECT 
         COALESCE(SUM(totalrevenue), 0) AS total_revenue,
         COALESCE(SUM(totalquantitysold), 0) AS total_quantity,
         COUNT(DISTINCT summarydate) AS summary_days
       FROM salessummary`
    );

    const dailyRes = await query(
      `SELECT 
         summarydate::date AS summary_date,
         COALESCE(SUM(totalrevenue), 0) AS total_revenue,
         COALESCE(SUM(totalquantitysold), 0) AS total_quantity
       FROM salessummary
       GROUP BY summarydate::date
       ORDER BY summarydate::date`
    );

    const topProductsRes = await query(
      `SELECT 
         p.productid AS product_id,
         p.productnameth AS product_name_th,
         p.productnameen AS product_name_en,
         COALESCE(SUM(s.totalrevenue), 0) AS total_revenue,
         COALESCE(SUM(s.totalquantitysold), 0) AS total_quantity
       FROM salessummary s
       JOIN products p ON p.productid = s.productid
       GROUP BY p.productid, p.productnameth, p.productnameen
       ORDER BY total_quantity DESC, total_revenue DESC
       LIMIT 5`
    );

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

    const topProducts: TopProduct[] = topProductsRes.rows.map((row: any) => ({
      product_id: row.product_id,
      product_name_th: row.product_name_th,
      product_name_en: row.product_name_en,
      total_revenue: Number(row.total_revenue) || 0,
      total_quantity: Number(row.total_quantity) || 0,
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
    });
  } catch (error: any) {
    console.error('Error fetching sales summary:', error);
    const message = error?.message || 'Unknown error';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

