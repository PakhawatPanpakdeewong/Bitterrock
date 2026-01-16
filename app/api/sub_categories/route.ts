import { NextRequest, NextResponse } from 'next/server';
import { query } from '../../../database/connection';

// GET - Fetch subcategories, optionally filtered by category_id
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryIdParam = searchParams.get('category_id');

    // Build base query - using lowercase table and column names without underscores
    let sql = `
      SELECT 
        sc.subcategoryid as sub_category_id,
        sc.subcategorynameth as sub_category_name_th,
        sc.subcategorynameen as sub_category_name_en,
        sc.subcategorynameth as sub_category_name,
        sc.categoryid as category_id,
        c.categorynameth as category_name_th,
        c.categorynameen as category_name_en
      FROM subcategories sc
      LEFT JOIN categories c ON c.categoryid = sc.categoryid
    `;

    const params: any[] = [];
    if (categoryIdParam) {
      sql += ` WHERE sc.categoryid = $1`;
      params.push(parseInt(categoryIdParam));
    }
    sql += ` ORDER BY sc.categoryid, sc.subcategoryid`;

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
    const { category_id, sub_category_name_th, sub_category_name_en } = body;

    // Validate required fields
    if (!category_id) {
      return NextResponse.json(
        { success: false, error: 'Category is required' },
        { status: 400 }
      );
    }

    if (!sub_category_name_th || sub_category_name_th.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'Subcategory name (Thai) is required' },
        { status: 400 }
      );
    }

    if (!sub_category_name_en || sub_category_name_en.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'Subcategory name (English) is required' },
        { status: 400 }
      );
    }

    // Check if category exists
    const categoryExists = await query(
      'SELECT categoryid FROM categories WHERE categoryid = $1',
      [parseInt(category_id)]
    );

    if (categoryExists.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Selected category does not exist' },
        { status: 400 }
      );
    }

    // Insert new subcategory (subcategoryid is SERIAL, auto-generated)
    const result = await query(
      `INSERT INTO subcategories (categoryid, subcategorynameth, subcategorynameen) 
       VALUES ($1, $2, $3) 
       RETURNING subcategoryid as sub_category_id, categoryid as category_id, subcategorynameth as sub_category_name_th, subcategorynameen as sub_category_name_en`,
      [parseInt(category_id), sub_category_name_th.trim(), sub_category_name_en.trim()]
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
    const { sub_category_id, category_id, sub_category_name_th, sub_category_name_en } = body;

    // Validate required fields
    if (!sub_category_id) {
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

    if (!sub_category_name_th || sub_category_name_th.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'Subcategory name (Thai) is required' },
        { status: 400 }
      );
    }

    if (!sub_category_name_en || sub_category_name_en.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'Subcategory name (English) is required' },
        { status: 400 }
      );
    }

    // Check if subcategory exists
    const existingSubcategory = await query(
      'SELECT subcategoryid FROM subcategories WHERE subcategoryid = $1',
      [parseInt(sub_category_id)]
    );

    if (existingSubcategory.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Subcategory not found' },
        { status: 404 }
      );
    }

    // Check if category exists
    const categoryExists = await query(
      'SELECT categoryid FROM categories WHERE categoryid = $1',
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
      `UPDATE subcategories 
       SET categoryid = $1, subcategorynameth = $2, subcategorynameen = $3
       WHERE subcategoryid = $4
       RETURNING subcategoryid as sub_category_id, categoryid as category_id, subcategorynameth as sub_category_name_th, subcategorynameen as sub_category_name_en`,
      [parseInt(category_id), sub_category_name_th.trim(), sub_category_name_en.trim(), parseInt(sub_category_id)]
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
      'SELECT subcategoryid FROM subcategories WHERE subcategoryid = $1',
      [parseInt(sub_category_id)]
    );

    if (existingSubcategory.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Subcategory not found' },
        { status: 404 }
      );
    }

    // Block deletion if any products reference this subcategory
    const prodCountRes = await query(
      'SELECT COUNT(1) AS cnt FROM products WHERE subcategoryid = $1',
      [parseInt(sub_category_id)]
    );
    const prodCount = Number(prodCountRes.rows?.[0]?.cnt || 0);
    if (prodCount > 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Cannot delete: subcategory is in use by existing products',
          details: `There are ${prodCount} product(s) referencing this subcategory.`,
        },
        { status: 409 }
      );
    }

    // Delete subcategory
    await query(
      'DELETE FROM subcategories WHERE subcategoryid = $1',
      [parseInt(sub_category_id)]
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