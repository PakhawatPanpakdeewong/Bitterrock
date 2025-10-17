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

    // Build base query
    let sql = `
      SELECT 
        av.attribute_value_id,
        av.attribute_id,
        av.attribute_value_th,
        av.attribute_value_en,
        a.attribute_name_th,
        a.attribute_name_en
      FROM attribute_values av
      LEFT JOIN attributes a ON a.attribute_id = av.attribute_id
    `;

    const params: any[] = [];
    if (attributeIdParam) {
      sql += ` WHERE av.attribute_id = $1`;
      params.push(parseInt(attributeIdParam));
    }
    sql += ` ORDER BY a.attribute_name_th NULLS LAST, av.attribute_value_th`;

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
    const { attribute_value_id, attribute_id, attribute_value_th, attribute_value_en } = body;

    // Validate required fields
    if (!attribute_value_id || attribute_value_id.trim() === '') {
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

    // Validate attribute value ID format (3 characters)
    if (attribute_value_id.trim().length !== 3) {
      return NextResponse.json(
        { success: false, error: 'Attribute value ID must be exactly 3 characters' },
        { status: 400 }
      );
    }

    // Check if attribute value ID already exists
    const existingAttributeValue = await query(
      'SELECT attribute_value_id FROM attribute_values WHERE attribute_value_id = $1',
      [attribute_value_id.trim().toUpperCase()]
    );

    if (existingAttributeValue.rows.length > 0) {
      return NextResponse.json(
        { success: false, error: 'Attribute value with this ID already exists' },
        { status: 409 }
      );
    }

    // Check if attribute exists
    const attributeExists = await query(
      'SELECT attribute_id FROM attributes WHERE attribute_id = $1',
      [parseInt(attribute_id)]
    );

    if (attributeExists.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Selected attribute does not exist' },
        { status: 400 }
      );
    }

    // Insert new attribute value
    const result = await query(
      `INSERT INTO attribute_values (attribute_value_id, attribute_id, attribute_value_th, attribute_value_en) 
       VALUES ($1, $2, $3, $4) 
       RETURNING attribute_value_id, attribute_id, attribute_value_th, attribute_value_en`,
      [attribute_value_id.trim().toUpperCase(), parseInt(attribute_id), attribute_value_th.trim(), attribute_value_en.trim()]
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
    if (!attribute_value_id || attribute_value_id.trim() === '') {
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
      'SELECT attribute_value_id FROM attribute_values WHERE attribute_value_id = $1',
      [attribute_value_id.trim().toUpperCase()]
    );

    if (existingAttributeValue.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Attribute value not found' },
        { status: 404 }
      );
    }

    // Check if attribute exists
    const attributeExists = await query(
      'SELECT attribute_id FROM attributes WHERE attribute_id = $1',
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
      `UPDATE attribute_values 
       SET attribute_id = $1, attribute_value_th = $2, attribute_value_en = $3
       WHERE attribute_value_id = $4
       RETURNING attribute_value_id, attribute_id, attribute_value_th, attribute_value_en`,
      [parseInt(attribute_id), attribute_value_th.trim(), attribute_value_en.trim(), attribute_value_id.trim().toUpperCase()]
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
      'SELECT attribute_value_id FROM attribute_values WHERE attribute_value_id = $1',
      [attribute_value_id.toUpperCase()]
    );

    if (existingAttributeValue.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Attribute value not found' },
        { status: 404 }
      );
    }

    // Block deletion if any product variants reference this attribute value
    const variantCountRes = await query(
      'SELECT COUNT(1) AS cnt FROM product_variants WHERE attribute_value_id = $1',
      [attribute_value_id.toUpperCase()]
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
      'DELETE FROM attribute_values WHERE attribute_value_id = $1',
      [attribute_value_id.toUpperCase()]
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

