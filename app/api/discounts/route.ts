import { NextRequest, NextResponse } from 'next/server';
import { query } from '../../../database/connection';

type DbDiscount = {
  discount_id: number;
  discount_code: string;
  discount_type: string;
  discount_value: number;
  minimum_order_amount: number;
  maximum_discount_amount: number | null;
  start_date: string;
  end_date: string;
  usage_limit: number | null;
  used_count: number;
  is_active: boolean;
  created_date: string;
};

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit') || 50)));
    const offset = Math.max(0, Number(searchParams.get('offset') || 0));
    const search = searchParams.get('search');
    const is_active = searchParams.get('is_active');

    const params: (string | number | boolean)[] = [];
    const conditions: string[] = [];

    if (search) {
      conditions.push(`(d.discountcode ILIKE $${params.length + 1})`);
      params.push(`%${search}%`);
    }

    if (is_active === 'true' || is_active === 'false') {
      conditions.push(`d.isactive = $${params.length + 1}`);
      params.push(is_active === 'true');
    }

    const whereSql = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    params.push(limit, offset);

    const res = await query(
      `SELECT 
        d.discountid as discount_id,
        d.discountcode as discount_code,
        d.discounttype as discount_type,
        d.discountvalue as discount_value,
        d.minimumorderamount as minimum_order_amount,
        d.maximumdiscountamount as maximum_discount_amount,
        d.startdate as start_date,
        d.enddate as end_date,
        d.usagelimit as usage_limit,
        d.usedcount as used_count,
        d.isactive as is_active,
        d.createddate as created_date
      FROM discounts d
      ${whereSql}
      ORDER BY d.createddate DESC
      LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    const countRes = await query(
      `SELECT COUNT(*) as total FROM discounts d ${whereSql}`,
      params.slice(0, -2)
    );

    const total = parseInt(countRes.rows[0]?.total || '0', 10);

    return NextResponse.json({
      ok: true,
      items: res.rows as unknown as DbDiscount[],
      total,
    });
  } catch (error: unknown) {
    console.error('Error fetching discounts:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      discount_code,
      discount_type,
      discount_value,
      minimum_order_amount = 0,
      maximum_discount_amount,
      start_date,
      end_date,
      usage_limit,
      is_active = true,
    } = body;

    if (!discount_code || !discount_type || !discount_value || !start_date || !end_date) {
      return NextResponse.json(
        { ok: false, error: 'กรุณากรอก รหัสโปรโมชั่น, ประเภท, มูลค่า, วันเริ่มต้น และวันสิ้นสุด' },
        { status: 400 }
      );
    }

    if (!['percentage', 'fixed_amount'].includes(discount_type)) {
      return NextResponse.json(
        { ok: false, error: 'ประเภทโปรโมชั่นต้องเป็น percentage หรือ fixed_amount' },
        { status: 400 }
      );
    }

    if (Number(discount_value) <= 0) {
      return NextResponse.json(
        { ok: false, error: 'มูลค่าส่วนลดต้องมากกว่า 0' },
        { status: 400 }
      );
    }

    if (Number(minimum_order_amount) < 0) {
      return NextResponse.json(
        { ok: false, error: 'ยอดขั้นต่ำต้องไม่เป็นค่าติดลบ' },
        { status: 400 }
      );
    }

    const res = await query(
      `INSERT INTO discounts (
        discountcode, discounttype, discountvalue,
        minimumorderamount, maximumdiscountamount,
        startdate, enddate, usagelimit, isactive
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING discountid as discount_id`,
      [
        String(discount_code).trim().toUpperCase(),
        discount_type,
        Number(discount_value),
        Number(minimum_order_amount),
        maximum_discount_amount != null ? Number(maximum_discount_amount) : null,
        start_date,
        end_date,
        usage_limit != null ? Number(usage_limit) : null,
        Boolean(is_active),
      ]
    );

    const row = res.rows[0];
    return NextResponse.json({ ok: true, discount_id: row?.discount_id });
  } catch (error: unknown) {
    console.error('Error creating discount:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    if (message.includes('discounts_discountcode_key') || message.includes('unique')) {
      return NextResponse.json(
        { ok: false, error: 'รหัสโปรโมชั่นนี้มีอยู่แล้ว' },
        { status: 400 }
      );
    }
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      discount_id,
      discount_code,
      discount_type,
      discount_value,
      minimum_order_amount = 0,
      maximum_discount_amount,
      start_date,
      end_date,
      usage_limit,
      is_active,
    } = body;

    if (!discount_id) {
      return NextResponse.json(
        { ok: false, error: 'กรุณาระบุ discount_id' },
        { status: 400 }
      );
    }

    const updates: string[] = [];
    const params: (string | number | boolean | null)[] = [];
    let idx = 1;

    if (discount_code !== undefined) {
      updates.push(`discountcode = $${idx++}`);
      params.push(String(discount_code).trim().toUpperCase());
    }
    if (discount_type !== undefined) {
      if (!['percentage', 'fixed_amount'].includes(discount_type)) {
        return NextResponse.json(
          { ok: false, error: 'ประเภทโปรโมชั่นต้องเป็น percentage หรือ fixed_amount' },
          { status: 400 }
        );
      }
      updates.push(`discounttype = $${idx++}`);
      params.push(discount_type);
    }
    if (discount_value !== undefined) {
      if (Number(discount_value) <= 0) {
        return NextResponse.json(
          { ok: false, error: 'มูลค่าส่วนลดต้องมากกว่า 0' },
          { status: 400 }
        );
      }
      updates.push(`discountvalue = $${idx++}`);
      params.push(Number(discount_value));
    }
    if (minimum_order_amount !== undefined) {
      updates.push(`minimumorderamount = $${idx++}`);
      params.push(Number(minimum_order_amount));
    }
    if (maximum_discount_amount !== undefined) {
      updates.push(`maximumdiscountamount = $${idx++}`);
      params.push(maximum_discount_amount == null ? null : Number(maximum_discount_amount));
    }
    if (start_date !== undefined) {
      updates.push(`startdate = $${idx++}`);
      params.push(start_date);
    }
    if (end_date !== undefined) {
      updates.push(`enddate = $${idx++}`);
      params.push(end_date);
    }
    if (usage_limit !== undefined) {
      updates.push(`usagelimit = $${idx++}`);
      params.push(usage_limit == null ? null : Number(usage_limit));
    }
    if (is_active !== undefined) {
      updates.push(`isactive = $${idx++}`);
      params.push(Boolean(is_active));
    }

    if (updates.length === 0) {
      return NextResponse.json({ ok: false, error: 'ไม่มีข้อมูลที่จะอัปเดต' }, { status: 400 });
    }

    params.push(discount_id);
    const sql = `UPDATE discounts SET ${updates.join(', ')} WHERE discountid = $${idx}`;
    await query(sql, params);

    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    console.error('Error updating discount:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    if (message.includes('discounts_discountcode_key') || message.includes('unique')) {
      return NextResponse.json(
        { ok: false, error: 'รหัสโปรโมชั่นนี้มีอยู่แล้ว' },
        { status: 400 }
      );
    }
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const discountId = searchParams.get('id');

    if (!discountId) {
      return NextResponse.json(
        { ok: false, error: 'กรุณาระบุ discount_id' },
        { status: 400 }
      );
    }

    const checkRes = await query(
      'SELECT COUNT(*) as cnt FROM orders WHERE discountid = $1',
      [discountId]
    );
    const usedCount = parseInt(checkRes.rows[0]?.cnt || '0', 10);
    if (usedCount > 0) {
      return NextResponse.json(
        { ok: false, error: 'ไม่สามารถลบโปรโมชั่นที่ถูกใช้งานในออเดอร์แล้วได้' },
        { status: 400 }
      );
    }

    await query('DELETE FROM discounts WHERE discountid = $1', [discountId]);
    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    console.error('Error deleting discount:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
