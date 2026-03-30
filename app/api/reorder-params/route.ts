import { NextRequest, NextResponse } from 'next/server';
import { query } from '../../../database/connection';
import { forbidStaffApi } from '@/lib/staff-api-guard';
import { hasVariantReorderMaxLeadColumn } from '@/lib/variant-reorder-schema';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const variantId = searchParams.get('variant_id');
    const warehouseId = searchParams.get('warehouse_id');

    if (variantId && warehouseId) {
      const hasMaxLead = await hasVariantReorderMaxLeadColumn();
      const res = await query(
        hasMaxLead
          ? `SELECT leadtimedays as lead_time_days, maxleadtimedays as max_lead_time_days,
                    safetystock as safety_stock, orderingcost as ordering_cost,
                    holdingcostpercent as holding_cost_percent
             FROM variantreorderparams WHERE variantid = $1 AND warehouseid = $2`
          : `SELECT leadtimedays as lead_time_days, leadtimedays as max_lead_time_days,
                    safetystock as safety_stock, orderingcost as ordering_cost,
                    holdingcostpercent as holding_cost_percent
             FROM variantreorderparams WHERE variantid = $1 AND warehouseid = $2`,
        [Number(variantId), Number(warehouseId)]
      );
      const row = res.rows[0];
      if (!row) {
        return NextResponse.json({ ok: true, params: null });
      }
      return NextResponse.json({
        ok: true,
        params: {
          lead_time_days: Number(row.lead_time_days) || 7,
          max_lead_time_days: row.max_lead_time_days != null ? Number(row.max_lead_time_days) : 7,
          safety_stock: Number(row.safety_stock) || 10,
          ordering_cost: Number(row.ordering_cost) || 100,
          holding_cost_percent: Number(row.holding_cost_percent) || 10,
        },
      });
    }

    return NextResponse.json({ ok: false, error: 'variant_id and warehouse_id required' }, { status: 400 });
  } catch (error: unknown) {
    console.error('Error fetching reorder params:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const denied = await forbidStaffApi();
    if (denied) return denied;

    const body = await req.json();
    const {
      variant_id,
      warehouse_id,
      lead_time_days,
      max_lead_time_days,
      safety_stock,
      ordering_cost,
      holding_cost_percent,
    } = body;

    if (variant_id === undefined || variant_id === null) {
      return NextResponse.json({ ok: false, error: 'variant_id required' }, { status: 400 });
    }
    if (warehouse_id === undefined || warehouse_id === null) {
      return NextResponse.json({ ok: false, error: 'warehouse_id required' }, { status: 400 });
    }

    const lt = lead_time_days ?? 7;
    const mlt = max_lead_time_days ?? 7;
    const hasMaxLead = await hasVariantReorderMaxLeadColumn();

    if (hasMaxLead) {
      const params = [
        variant_id,
        warehouse_id,
        lt,
        mlt,
        safety_stock ?? 10,
        ordering_cost ?? 100,
        holding_cost_percent ?? 10,
      ];
      const updateRes = await query(
        `UPDATE variantreorderparams SET
           leadtimedays = $3, maxleadtimedays = $4, safetystock = $5, orderingcost = $6, holdingcostpercent = $7
         WHERE variantid = $1 AND warehouseid = $2`,
        params
      );
      if (updateRes.rowCount === 0) {
        await query(
          `INSERT INTO variantreorderparams (variantid, warehouseid, dailydemand, leadtimedays, maxleadtimedays, safetystock, orderingcost, holdingcostpercent)
           VALUES ($1, $2, 5, $3, $4, $5, $6, $7)`,
          params
        );
      }
    } else {
      const params = [
        variant_id,
        warehouse_id,
        lt,
        safety_stock ?? 10,
        ordering_cost ?? 100,
        holding_cost_percent ?? 10,
      ];
      const updateRes = await query(
        `UPDATE variantreorderparams SET
           leadtimedays = $3, safetystock = $4, orderingcost = $5, holdingcostpercent = $6
         WHERE variantid = $1 AND warehouseid = $2`,
        params
      );
      if (updateRes.rowCount === 0) {
        await query(
          `INSERT INTO variantreorderparams (variantid, warehouseid, dailydemand, leadtimedays, safetystock, orderingcost, holdingcostpercent)
           VALUES ($1, $2, 5, $3, $4, $5, $6)`,
          params
        );
      }
    }
    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    console.error('Error saving reorder params:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const denied = await forbidStaffApi();
    if (denied) return denied;

    const { searchParams } = new URL(req.url);
    const variantId = searchParams.get('variant_id');
    const warehouseId = searchParams.get('warehouse_id');
    if (!variantId || !warehouseId) {
      return NextResponse.json({ ok: false, error: 'variant_id and warehouse_id required' }, { status: 400 });
    }
    await query(`DELETE FROM variantreorderparams WHERE variantid = $1 AND warehouseid = $2`, [
      Number(variantId),
      Number(warehouseId),
    ]);
    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    console.error('Error deleting reorder params:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
