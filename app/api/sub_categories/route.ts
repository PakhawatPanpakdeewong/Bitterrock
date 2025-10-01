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
