import { NextRequest, NextResponse } from 'next/server';
import { query } from '../../../database/connection';

type DbAttribute = {
  attribute_id: number;
  attribute_name_th: string;
  attribute_name_en: string;
};

type DbAttributeValue = {
  attribute_value_id: string;
  attribute_id: number;
  attribute_value_th: string;
  attribute_value_en: string;
};

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const includeValues = searchParams.get('include_values') === 'true';

    // Fetch attributes - using lowercase column names without underscores
    const attributesRes = await query(
      `SELECT attributeid as attribute_id, attributenameth as attribute_name_th, attributenameen as attribute_name_en
       FROM attributes
       ORDER BY attributeid`,
      []
    );

    const attributes = attributesRes.rows as unknown as DbAttribute[];

    if (!includeValues) {
      return NextResponse.json({ ok: true, items: attributes });
    }

    // Fetch attribute values if requested - using lowercase table and column names without underscores
    const valuesRes = await query(
      `SELECT av.attributevalueid as attribute_value_id, av.attributeid as attribute_id, av.attributevalueth as attribute_value_th, av.attributevalueen as attribute_value_en, av.attributevaluecode as attribute_value_code
       FROM attributevalues av
       ORDER BY av.attributeid, av.attributevalueid`,
      []
    );

    const values = valuesRes.rows as unknown as DbAttributeValue[];
    
    // Group values by attribute
    const attributeIdToValues: Record<number, DbAttributeValue[]> = {};
    for (const value of values) {
      if (!attributeIdToValues[value.attribute_id]) {
        attributeIdToValues[value.attribute_id] = [];
      }
      attributeIdToValues[value.attribute_id].push(value);
    }

    const items = attributes.map(attr => ({
      ...attr,
      values: attributeIdToValues[attr.attribute_id] || []
    }));

    return NextResponse.json({ ok: true, items });
  } catch (error: any) {
    const message = error?.message || 'Unknown error';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { attribute_name_th, attribute_name_en } = body || {};

    if (!attribute_name_th || !attribute_name_en) {
      return NextResponse.json({ ok: false, error: 'attribute_name_th and attribute_name_en are required' }, { status: 400 });
    }

    const insertRes = await query(
      `INSERT INTO attributes (attributenameth, attributenameen)
       VALUES ($1, $2)
       RETURNING attributeid as attribute_id`,
      [attribute_name_th.trim(), attribute_name_en.trim()]
    );

    const newId = insertRes.rows[0]?.attribute_id;
    return NextResponse.json({ ok: true, id: newId });
  } catch (error: any) {
    const message = error?.message || 'Unknown error';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
