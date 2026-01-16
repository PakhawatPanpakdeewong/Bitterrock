import { NextRequest, NextResponse } from 'next/server';
import { query } from '../../../database/connection';

export async function GET(request: NextRequest) {
  try {
    const categoriesResult = await query(
      `SELECT categoryid AS category_id,
              categorynameth AS category_name_th,
              categorynameen AS category_name_en
       FROM categories
       ORDER BY categoryid`
    );

    const mapped = categoriesResult.rows.map((row: any) => ({
      category_id: row.category_id,
      category_name: row.category_name_th,
      category_name_th: row.category_name_th,
      category_name_en: row.category_name_en,
    }));

    return NextResponse.json({ success: true, data: mapped });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch categories',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// POST - Create a new category
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { category_name, description } = body;

    // Validate required fields
    if (!category_name || category_name.trim() === '') {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Category name is required' 
        },
        { status: 400 }
      );
    }

    // Check if category already exists
    const existingCategory = await query(
      'SELECT category_id FROM categories WHERE category_name = $1',
      [category_name.trim()]
    );

    if (existingCategory.rows.length > 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Category with this name already exists' 
        },
        { status: 409 }
      );
    }

    // Insert new category
    const result = await query(
      `INSERT INTO categories (category_name, description) 
       VALUES ($1, $2) 
       RETURNING category_id, category_name, description, created_date`,
      [category_name.trim(), description?.trim() || null]
    );

    return NextResponse.json({
      success: true,
      data: result.rows[0],
      message: 'Category created successfully'
    });

  } catch (error) {
    console.error('Error creating category:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to create category',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// PUT - Update an existing category
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { category_id, category_name, description } = body;

    // Validate required fields
    if (!category_id) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Category ID is required' 
        },
        { status: 400 }
      );
    }

    // Convert category_id to number
    const categoryIdNum = parseInt(category_id);
    if (isNaN(categoryIdNum)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid category ID format' 
        },
        { status: 400 }
      );
    }

    if (!category_name || category_name.trim() === '') {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Category name is required' 
        },
        { status: 400 }
      );
    }

    // Check if category exists
    const existingCategory = await query(
      'SELECT category_id FROM categories WHERE category_id = $1',
      [categoryIdNum]
    );

    if (existingCategory.rows.length === 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Category not found' 
        },
        { status: 404 }
      );
    }

    // Check if another category with the same name exists
    const duplicateCategory = await query(
      'SELECT category_id FROM categories WHERE category_name = $1 AND category_id != $2',
      [category_name.trim(), categoryIdNum]
    );

    if (duplicateCategory.rows.length > 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Category with this name already exists' 
        },
        { status: 409 }
      );
    }

    // Update category
    const result = await query(
      `UPDATE categories 
       SET category_name = $1, description = $2
       WHERE category_id = $3
       RETURNING category_id, category_name, description, created_date`,
      [category_name.trim(), description?.trim() || null, categoryIdNum]
    );

    return NextResponse.json({
      success: true,
      data: result.rows[0],
      message: 'Category updated successfully'
    });

  } catch (error) {
    console.error('Error updating category:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to update category',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// DELETE - Delete a category
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category_id = searchParams.get('id');

    if (!category_id) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Category ID is required' 
        },
        { status: 400 }
      );
    }

    // Check if category exists
    const existingCategory = await query(
      'SELECT category_id FROM categories WHERE category_id = $1',
      [category_id]
    );

    if (existingCategory.rows.length === 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Category not found' 
        },
        { status: 404 }
      );
    }

    // Check if category has products
    const productsCount = await query(
      'SELECT COUNT(*) as count FROM products WHERE category_id = $1',
      [category_id]
    );

    if (parseInt(productsCount.rows[0].count) > 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Cannot delete category that has products. Please remove or reassign products first.' 
        },
        { status: 409 }
      );
    }

    // Delete category
    await query(
      'DELETE FROM categories WHERE category_id = $1',
      [category_id]
    );

    return NextResponse.json({
      success: true,
      message: 'Category deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting category:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to delete category',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}