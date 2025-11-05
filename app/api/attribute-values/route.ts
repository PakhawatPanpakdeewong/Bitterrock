import { NextRequest, NextResponse } from 'next/server';
import { query } from '../../../database/connection';

type DbAttributeValue = {
  attribute_value_id: string;
  attribute_id: number;
  attribute_value_th: string;
  attribute_value_en: string;
};

// GET - Fetch attribute values, optionally filtered by attribute_id
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const attributeIdParam = searchParams.get('attribute_id');

    // Build base query - using lowercase table and column names without underscores
    let sql = `
      SELECT 
        av.attributevalueid as attribute_value_id,
        av.attributeid as attribute_id,
        av.attributevalueth as attribute_value_th,
        av.attributevalueen as attribute_value_en,
        a.attributenameth as attribute_name_th,
        a.attributenameen as attribute_name_en
      FROM attributevalues av
      LEFT JOIN attributes a ON a.attributeid = av.attributeid
    `;

    const params: any[] = [];
    if (attributeIdParam) {
      sql += ` WHERE av.attributeid = $1`;
      params.push(parseInt(attributeIdParam));
    }
    sql += ` ORDER BY a.attributenameth NULLS LAST, av.attributevalueth`;

    const result = await query(sql, params);

    return NextResponse.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error('Error fetching attribute values:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch attribute values',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// POST - Create a new attribute value
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { attribute_id, attribute_value_th, attribute_value_en } = body;

    // Validate required fields
    if (!attribute_id) {
      return NextResponse.json(
        { success: false, error: 'Attribute is required' },
        { status: 400 }
      );
    }

    if (!attribute_value_th || attribute_value_th.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'Attribute value (Thai) is required' },
        { status: 400 }
      );
    }

    if (!attribute_value_en || attribute_value_en.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'Attribute value (English) is required' },
        { status: 400 }
      );
    }

    // Check if attribute exists
    const attributeExists = await query(
      'SELECT attributeid FROM attributes WHERE attributeid = $1',
      [parseInt(attribute_id)]
    );

    if (attributeExists.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Selected attribute does not exist' },
        { status: 400 }
      );
    }

    // Insert new attribute value (attributevalueid is SERIAL, auto-generated)
    const result = await query(
      `INSERT INTO attributevalues (attributeid, attributevalueth, attributevalueen) 
       VALUES ($1, $2, $3) 
       RETURNING attributevalueid as attribute_value_id, attributeid as attribute_id, attributevalueth as attribute_value_th, attributevalueen as attribute_value_en`,
      [parseInt(attribute_id), attribute_value_th.trim(), attribute_value_en.trim()]
    );

    return NextResponse.json({
      success: true,
      data: result.rows[0],
      message: 'Attribute value created successfully'
    });

  } catch (error) {
    console.error('Error creating attribute value:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create attribute value',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// PUT - Update an existing attribute value
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { attribute_value_id, attribute_id, attribute_value_th, attribute_value_en } = body;

    // Validate required fields
    if (!attribute_value_id) {
      return NextResponse.json(
        { success: false, error: 'Attribute value ID is required' },
        { status: 400 }
      );
    }

    if (!attribute_id) {
      return NextResponse.json(
        { success: false, error: 'Attribute is required' },
        { status: 400 }
      );
    }

    if (!attribute_value_th || attribute_value_th.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'Attribute value (Thai) is required' },
        { status: 400 }
      );
    }

    if (!attribute_value_en || attribute_value_en.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'Attribute value (English) is required' },
        { status: 400 }
      );
    }

    // Check if attribute value exists
    const existingAttributeValue = await query(
      'SELECT attributevalueid FROM attributevalues WHERE attributevalueid = $1',
      [parseInt(attribute_value_id)]
    );

    if (existingAttributeValue.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Attribute value not found' },
        { status: 404 }
      );
    }

    // Check if attribute exists
    const attributeExists = await query(
      'SELECT attributeid FROM attributes WHERE attributeid = $1',
      [parseInt(attribute_id)]
    );

    if (attributeExists.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Selected attribute does not exist' },
        { status: 400 }
      );
    }

    // Update attribute value
    const result = await query(
      `UPDATE attributevalues 
       SET attributeid = $1, attributevalueth = $2, attributevalueen = $3
       WHERE attributevalueid = $4
       RETURNING attributevalueid as attribute_value_id, attributeid as attribute_id, attributevalueth as attribute_value_th, attributevalueen as attribute_value_en`,
      [parseInt(attribute_id), attribute_value_th.trim(), attribute_value_en.trim(), parseInt(attribute_value_id)]
    );

    return NextResponse.json({
      success: true,
      data: result.rows[0],
      message: 'Attribute value updated successfully'
    });

  } catch (error) {
    console.error('Error updating attribute value:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update attribute value',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// DELETE - Delete an attribute value
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const attribute_value_id = searchParams.get('id');

    if (!attribute_value_id) {
      return NextResponse.json(
        { success: false, error: 'Attribute value ID is required' },
        { status: 400 }
      );
    }

    // Check if attribute value exists
    const existingAttributeValue = await query(
      'SELECT attributevalueid FROM attributevalues WHERE attributevalueid = $1',
      [parseInt(attribute_value_id)]
    );

    if (existingAttributeValue.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Attribute value not found' },
        { status: 404 }
      );
    }

    // Block deletion if any product variants reference this attribute value
    const variantCountRes = await query(
      'SELECT COUNT(1) AS cnt FROM productvariants WHERE attributevalueid = $1',
      [parseInt(attribute_value_id)]
    );
    const variantCount = Number(variantCountRes.rows?.[0]?.cnt || 0);
    if (variantCount > 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Cannot delete: attribute value is in use by existing product variants',
          details: `There are ${variantCount} product variant(s) referencing this attribute value.`,
        },
        { status: 409 }
      );
    }

    // Delete attribute value
    await query(
      'DELETE FROM attributevalues WHERE attributevalueid = $1',
      [parseInt(attribute_value_id)]
    );

    return NextResponse.json({
      success: true,
      message: 'Attribute value deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting attribute value:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete attribute value',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

