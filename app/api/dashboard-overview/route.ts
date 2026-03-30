import { NextRequest, NextResponse } from 'next/server';
import { query } from '../../../database/connection';
import { forbidStaffApi } from '@/lib/staff-api-guard';

export const dynamic = 'force-dynamic';

const TZ_STORE = 'Asia/Bangkok';

async function cogsForRange(startDate: string, endDate: string): Promise<number> {
  const res = await query(
    `SELECT COALESCE(SUM(oi.quantityordered * COALESCE(pv.cost, 0)), 0)::float8 AS cogs
     FROM order_items oi
     JOIN orders o ON o.orderid = oi.orderid
     JOIN inventories inv ON inv.inventoryid = oi.inventoryid
     JOIN productvariants pv ON pv.variantid = inv.variantid
     WHERE o.orderstatus <> 'cancelled'
       AND (timezone($1, o.orderdate))::date >= $2::date
       AND (timezone($1, o.orderdate))::date <= $3::date`,
    [TZ_STORE, startDate, endDate]
  );
  return Number(res.rows[0]?.cogs) || 0;
}

export async function GET(_req: NextRequest) {
  try {
    const denied = await forbidStaffApi();
    if (denied) return denied;

    const boundsRes = await query(
      `SELECT
         (timezone($1, now()))::date AS today_bk,
         (date_trunc('month', timezone($1, now())))::date AS month_start_bk,
         (date_trunc('week', timezone($1, now())))::date AS week_start_bk,
         ((date_trunc('month', timezone($1, now())))::date - interval '1 month')::date AS prev_month_start_bk,
         ((date_trunc('month', timezone($1, now())))::date - interval '1 day')::date AS prev_month_last_day_bk`,
      [TZ_STORE]
    );
    const b = boundsRes.rows[0] as {
      today_bk: string;
      month_start_bk: string;
      week_start_bk: string;
      prev_month_start_bk: string;
      prev_month_last_day_bk: string;
    };

    const todayBk = b.today_bk;
    const monthStartBk = b.month_start_bk;
    const weekStartBk = b.week_start_bk;
    const prevMonthStartBk = b.prev_month_start_bk;
    const prevMonthLastDayBk = b.prev_month_last_day_bk;

    const mtdSpanDays =
      Number(
        (
          await query(`SELECT ($1::date - $2::date)::integer AS span`, [todayBk, monthStartBk])
        ).rows[0]?.span
      ) || 0;

    const prevMtdEnd = await query(
      `SELECT LEAST(
          $1::date + $2::integer,
          $3::date
        )::text AS d`,
      [prevMonthStartBk, mtdSpanDays, prevMonthLastDayBk]
    );
    const prevMtdEndDate = (prevMtdEnd.rows[0] as { d: string }).d;

    const orderAgg = await query(
      `WITH o AS (
         SELECT
           o.orderid,
           o.totalamount,
           (timezone($1, o.orderdate))::date AS d
         FROM orders o
       )
       SELECT
         COALESCE(SUM(totalamount) FILTER (WHERE d = $2::date), 0)::float8 AS sales_today,
         COUNT(*) FILTER (WHERE d = $2::date)::int AS orders_today,

         COALESCE(SUM(totalamount) FILTER (WHERE d >= $3::date AND d <= $2::date), 0)::float8 AS sales_this_week,
         COUNT(*) FILTER (WHERE d >= $3::date AND d <= $2::date)::int AS orders_this_week,

         COALESCE(SUM(totalamount) FILTER (WHERE d >= $4::date AND d <= $2::date), 0)::float8 AS sales_mtd,
         COUNT(*) FILTER (WHERE d >= $4::date AND d <= $2::date)::int AS orders_mtd,

         COALESCE(SUM(totalamount) FILTER (WHERE d >= $5::date AND d <= $6::date), 0)::float8 AS sales_prev_mtd,
         COUNT(*) FILTER (WHERE d >= $5::date AND d <= $6::date)::int AS orders_prev_mtd,

         COALESCE(SUM(totalamount) FILTER (
           WHERE d >= (date_trunc('month', timezone($1, now())))::date
             AND d < (date_trunc('month', timezone($1, now())) + interval '1 month')::date
         ), 0)::float8 AS sales_calendar_month,
         COUNT(*) FILTER (
           WHERE d >= (date_trunc('month', timezone($1, now())))::date
             AND d < (date_trunc('month', timezone($1, now())) + interval '1 month')::date
         )::int AS orders_calendar_month,

         COALESCE(SUM(totalamount) FILTER (
           WHERE d >= (date_trunc('month', timezone($1, now())) - interval '1 month')::date
             AND d < (date_trunc('month', timezone($1, now())))::date
         ), 0)::float8 AS sales_full_prev_month,
         COUNT(*) FILTER (
           WHERE d >= (date_trunc('month', timezone($1, now())) - interval '1 month')::date
             AND d < (date_trunc('month', timezone($1, now())))::date
         )::int AS orders_full_prev_month
       FROM o`,
      [TZ_STORE, todayBk, weekStartBk, monthStartBk, prevMonthStartBk, prevMtdEndDate]
    );

    const row = orderAgg.rows[0] as Record<string, number>;

    const customersRes = await query(
      `SELECT
         COUNT(*) FILTER (
           WHERE (timezone($1, c.registrationdate))::date = $2::date
         )::int AS new_today,
         COUNT(*) FILTER (
           WHERE (timezone($1, c.registrationdate))::date >= $3::date
             AND (timezone($1, c.registrationdate))::date <= $2::date
         )::int AS new_this_week,
         COUNT(*) FILTER (
           WHERE (timezone($1, c.registrationdate))::date >= $4::date
             AND (timezone($1, c.registrationdate))::date <= $2::date
         )::int AS new_mtd,
         COUNT(*) FILTER (
           WHERE (timezone($1, c.registrationdate))::date >= $5::date
             AND (timezone($1, c.registrationdate))::date <= $6::date
         )::int AS new_prev_mtd
       FROM customers c`,
      [TZ_STORE, todayBk, weekStartBk, monthStartBk, prevMonthStartBk, prevMtdEndDate]
    );
    const cr = customersRes.rows[0] as Record<string, number>;

    const [cogs_mtd, cogs_prev_mtd, cogs_full_prev_month] = await Promise.all([
      cogsForRange(monthStartBk, todayBk),
      cogsForRange(prevMonthStartBk, prevMtdEndDate),
      cogsForRange(prevMonthStartBk, prevMonthLastDayBk),
    ]);

    const sales_mtd = Number(row.sales_mtd) || 0;
    const sales_prev_mtd = Number(row.sales_prev_mtd) || 0;
    const orders_mtd = Number(row.orders_mtd) || 0;
    const orders_prev_mtd = Number(row.orders_prev_mtd) || 0;
    const new_mtd = Number(cr.new_mtd) || 0;
    const new_prev_mtd = Number(cr.new_prev_mtd) || 0;

    const profit_mtd = sales_mtd - cogs_mtd;
    const profit_prev_mtd = sales_prev_mtd - cogs_prev_mtd;

    function growthPct(cur: number, prev: number): number | null {
      if (prev === 0) return cur === 0 ? 0 : null;
      return ((cur - prev) / prev) * 100;
    }

    return NextResponse.json({
      ok: true,
      timezone: TZ_STORE,
      periods: {
        today: { start: todayBk, end: todayBk },
        week: { start: weekStartBk, end: todayBk },
        month_mtd: { start: monthStartBk, end: todayBk },
        prev_month_mtd: { start: prevMonthStartBk, end: prevMtdEndDate },
      },
      quick: {
        sales_today: Number(row.sales_today) || 0,
        orders_today: Number(row.orders_today) || 0,
        sales_this_week: Number(row.sales_this_week) || 0,
        orders_this_week: Number(row.orders_this_week) || 0,
        sales_this_month_mtd: sales_mtd,
        orders_this_month_mtd: orders_mtd,
      },
      revenue_mtd: sales_mtd,
      orders_mtd,
      new_customers_mtd: new_mtd,
      expenses_mtd: cogs_mtd,
      net_profit_mtd: profit_mtd,
      comparison: {
        label: 'เทียบช่วงเดียวกันของเดือนก่อน (MTD)',
        revenue_prev_mtd: sales_prev_mtd,
        orders_prev_mtd,
        new_customers_prev_mtd: new_prev_mtd,
        expenses_prev_mtd: cogs_prev_mtd,
        net_profit_prev_mtd: profit_prev_mtd,
        growth_pct: {
          revenue: growthPct(sales_mtd, sales_prev_mtd),
          orders: growthPct(orders_mtd, orders_prev_mtd),
          new_customers: growthPct(new_mtd, new_prev_mtd),
          expenses: growthPct(cogs_mtd, cogs_prev_mtd),
          net_profit: growthPct(profit_mtd, profit_prev_mtd),
        },
      },
      extra: {
        sales_calendar_month: Number(row.sales_calendar_month) || 0,
        orders_calendar_month: Number(row.orders_calendar_month) || 0,
        sales_full_prev_month: Number(row.sales_full_prev_month) || 0,
        orders_full_prev_month: Number(row.orders_full_prev_month) || 0,
        expenses_full_prev_month: cogs_full_prev_month,
      },
    });
  } catch (error: unknown) {
    console.error('dashboard-overview error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
