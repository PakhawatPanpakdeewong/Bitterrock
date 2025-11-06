import { NextRequest, NextResponse } from 'next/server';
import { query } from '../../../database/connection';

type DbWarehouse = {
  warehouse_id: number;
  warehouse_name: string;
  location_address: string;
  contact_person: string | null;
  email: string | null;
};

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const warehouseId = searchParams.get('id');

    let sql = `
      SELECT 
        warehouseid as warehouse_id,
        warehousename as warehouse_name,
        locationaddress as location_address,
        contactperson as contact_person,
        email as email
      FROM warehouses
    `;

    const params: any[] = [];
    if (warehouseId) {
      sql += ` WHERE warehouseid = $1`;
      params.push(Number(warehouseId));
    }

    sql += ` ORDER BY warehousename`;

    const result = await query(sql, params);
    const warehouses = result.rows as unknown as DbWarehouse[];

    return NextResponse.json({ 
      ok: true, 
      items: warehouses.map(w => ({
        warehouseid: w.warehouse_id,
        warehousename: w.warehouse_name,
        locationaddress: w.location_address,
        contactperson: w.contact_person,
        email: w.email,
      }))
    });
  } catch (error: any) {
    console.error('Error fetching warehouses:', error);
    const message = error?.message || 'Unknown error';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      warehouse_name,
      location_address,
      contact_person = null,
      email = null,
    } = body;

    if (!warehouse_name || !location_address) {
      return NextResponse.json({ 
        ok: false, 
        error: 'warehouse_name and location_address are required' 
      }, { status: 400 });
    }

    try {
      const insertRes = await query(
        `INSERT INTO warehouses (warehousename, locationaddress, contactperson, email)
         VALUES ($1, $2, $3, $4)
         RETURNING warehouseid as warehouse_id`,
        [warehouse_name, location_address, contact_person, email]
      );

      const newId = insertRes.rows[0]?.warehouse_id;
      return NextResponse.json({ ok: true, id: newId });
    } catch (dbError: any) {
      console.error('Database error:', dbError);
      
      // Handle duplicate key error (primary key sequence out of sync)
      if (dbError?.code === '23505' || dbError?.constraint === 'warehouses_pkey') {
        // Sync the sequence to the max value
        try {
          await query(
            `SELECT setval(
              pg_get_serial_sequence('warehouses', 'warehouseid'),
              COALESCE((SELECT MAX(warehouseid) FROM warehouses), 1),
              true
            )`
          );
          
          // Retry the insert
          const retryRes = await query(
            `INSERT INTO warehouses (warehousename, locationaddress, contactperson, email)
             VALUES ($1, $2, $3, $4)
             RETURNING warehouseid as warehouse_id`,
            [warehouse_name, location_address, contact_person, email]
          );
          
          const newId = retryRes.rows[0]?.warehouse_id;
          return NextResponse.json({ ok: true, id: newId });
        } catch (retryError: any) {
          console.error('Retry failed:', retryError);
          return NextResponse.json({ 
            ok: false, 
            error: 'ไม่สามารถสร้างคลังสินค้าได้ กรุณาลองใหม่อีกครั้ง' 
          }, { status: 500 });
        }
      }
      
      // Other database errors
      const message = dbError?.message || 'Unknown error';
      return NextResponse.json({ 
        ok: false, 
        error: message || 'ไม่สามารถสร้างคลังสินค้าได้' 
      }, { status: 500 });
    }
  } catch (error: any) {
    console.error('Error creating warehouse:', error);
    const message = error?.message || 'Unknown error';
    return NextResponse.json({ 
      ok: false, 
      error: message || 'เกิดข้อผิดพลาดในการสร้างคลังสินค้า' 
    }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { warehouse_id, warehouse_name, location_address, contact_person, email } = body;

    if (!warehouse_id) {
      return NextResponse.json({ ok: false, error: 'warehouse_id is required' }, { status: 400 });
    }

    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (warehouse_name !== undefined) {
      fields.push(`warehousename = $${idx++}`);
      values.push(warehouse_name);
    }

    if (location_address !== undefined) {
      fields.push(`locationaddress = $${idx++}`);
      values.push(location_address);
    }

    if (contact_person !== undefined) {
      fields.push(`contactperson = $${idx++}`);
      values.push(contact_person);
    }

    if (email !== undefined) {
      fields.push(`email = $${idx++}`);
      values.push(email);
    }

    if (fields.length === 0) {
      return NextResponse.json({ ok: false, error: 'No fields to update' }, { status: 400 });
    }

    values.push(warehouse_id);
    const sql = `UPDATE warehouses SET ${fields.join(', ')} WHERE warehouseid = $${idx}`;
    await query(sql, values);

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error('Error updating warehouse:', error);
    const message = error?.message || 'Unknown error';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const idParam = searchParams.get('id');
    let warehouse_id: number | null = idParam ? Number(idParam) : null;

    if (!warehouse_id || Number.isNaN(warehouse_id)) {
      try {
        const body = await req.json();
        warehouse_id = Number(body?.warehouse_id);
      } catch {}
    }

    if (!warehouse_id || Number.isNaN(warehouse_id)) {
      return NextResponse.json({ ok: false, error: 'warehouse_id is required' }, { status: 400 });
    }

    await query(`DELETE FROM warehouses WHERE warehouseid = $1`, [warehouse_id]);
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error('Error deleting warehouse:', error);
    const message = error?.message || 'Unknown error';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

