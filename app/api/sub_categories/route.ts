import { NextRequest, NextResponse } from 'next/server';
import { query } from '../../../database/connection';

// GET - Fetch subcategories, optionally filtered by category_id
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryIdParam = searchParams.get('category_id');

    // Build base query
    let sql = `
      SELECT 
        sc.sub_category_id,
        sc.sub_category_name,
        sc.description,
        sc.category_id,
        c.category_name
      FROM sub_categories sc
      LEFT JOIN categories c ON c.category_id = sc.category_id
    `;

    const params: any[] = [];
    if (categoryIdParam) {
      sql += ` WHERE sc.category_id = $1`;
      params.push(parseInt(categoryIdParam));
    }
    sql += ` ORDER BY c.category_name NULLS LAST, sc.sub_category_name`;

    const result = await query(sql, params);

    return NextResponse.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error('Error fetching subcategories:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch subcategories',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// POST - Create a new subcategory
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sub_category_id, category_id, sub_category_name, description } = body;

    // Validate required fields
    if (!sub_category_id || sub_category_id.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'Subcategory ID is required' },
        { status: 400 }
      );
    }

    if (!category_id) {
      return NextResponse.json(
        { success: false, error: 'Category is required' },
        { status: 400 }
      );
    }

    if (!sub_category_name || sub_category_name.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'Subcategory name is required' },
        { status: 400 }
      );
    }

    if (!description || description.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'Description is required' },
        { status: 400 }
      );
    }

    // Validate subcategory ID format (3 characters)
    if (sub_category_id.trim().length !== 3) {
      return NextResponse.json(
        { success: false, error: 'Subcategory ID must be exactly 3 characters' },
        { status: 400 }
      );
    }

    // Check if subcategory ID already exists
    const existingSubcategory = await query(
      'SELECT sub_category_id FROM sub_categories WHERE sub_category_id = $1',
      [sub_category_id.trim().toUpperCase()]
    );

    if (existingSubcategory.rows.length > 0) {
      return NextResponse.json(
        { success: false, error: 'Subcategory with this ID already exists' },
        { status: 409 }
      );
    }

    // Check if category exists
    const categoryExists = await query(
      'SELECT category_id FROM categories WHERE category_id = $1',
      [parseInt(category_id)]
    );

    if (categoryExists.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Selected category does not exist' },
        { status: 400 }
      );
    }

    // Insert new subcategory
    const result = await query(
      `INSERT INTO sub_categories (sub_category_id, category_id, sub_category_name, description) 
       VALUES ($1, $2, $3, $4) 
       RETURNING sub_category_id, category_id, sub_category_name, description`,
      [sub_category_id.trim().toUpperCase(), parseInt(category_id), sub_category_name.trim(), description.trim()]
    );

    return NextResponse.json({
      success: true,
      data: result.rows[0],
      message: 'Subcategory created successfully'
    });

  } catch (error) {
    console.error('Error creating subcategory:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create subcategory',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// PUT - Update an existing subcategory
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { sub_category_id, category_id, sub_category_name, description } = body;

    // Validate required fields
    if (!sub_category_id || sub_category_id.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'Subcategory ID is required' },
        { status: 400 }
      );
    }

    if (!category_id) {
      return NextResponse.json(
        { success: false, error: 'Category is required' },
        { status: 400 }
      );
    }

    if (!sub_category_name || sub_category_name.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'Subcategory name is required' },
        { status: 400 }
      );
    }

    if (!description || description.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'Description is required' },
        { status: 400 }
      );
    }

    // Check if subcategory exists
    const existingSubcategory = await query(
      'SELECT sub_category_id FROM sub_categories WHERE sub_category_id = $1',
      [sub_category_id.trim().toUpperCase()]
    );

    if (existingSubcategory.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Subcategory not found' },
        { status: 404 }
      );
    }

    // Check if category exists
    const categoryExists = await query(
      'SELECT category_id FROM categories WHERE category_id = $1',
      [parseInt(category_id)]
    );

    if (categoryExists.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Selected category does not exist' },
        { status: 400 }
      );
    }

    // Update subcategory
    const result = await query(
      `UPDATE sub_categories 
       SET category_id = $1, sub_category_name = $2, description = $3
       WHERE sub_category_id = $4
       RETURNING sub_category_id, category_id, sub_category_name, description`,
      [parseInt(category_id), sub_category_name.trim(), description.trim(), sub_category_id.trim().toUpperCase()]
    );

    return NextResponse.json({
      success: true,
      data: result.rows[0],
      message: 'Subcategory updated successfully'
    });

  } catch (error) {
    console.error('Error updating subcategory:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update subcategory',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// DELETE - Delete a subcategory
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sub_category_id = searchParams.get('id');

    if (!sub_category_id) {
      return NextResponse.json(
        { success: false, error: 'Subcategory ID is required' },
        { status: 400 }
      );
    }

    // Check if subcategory exists
    const existingSubcategory = await query(
      'SELECT sub_category_id FROM sub_categories WHERE sub_category_id = $1',
      [sub_category_id.toUpperCase()]
    );

    if (existingSubcategory.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Subcategory not found' },
        { status: 404 }
      );
    }

    // Delete subcategory
    await query(
      'DELETE FROM sub_categories WHERE sub_category_id = $1',
      [sub_category_id.toUpperCase()]
    );

    return NextResponse.json({
      success: true,
      message: 'Subcategory deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting subcategory:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete subcategory',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}