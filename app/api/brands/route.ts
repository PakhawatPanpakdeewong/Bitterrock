import { NextRequest, NextResponse } from 'next/server';
import { query } from '../../../database/connection';

// GET - Fetch all brands, optionally filtered by subcategory_id
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const subcategoryIdParam = searchParams.get('subcategory_id');

    let sql = `
      SELECT 
        b.brandid as brand_id,
        b.brandnameth as brand_name_th,
        b.brandnameen as brand_name_en,
        b.brandcode as brand_code,
        b.subcategoryid as sub_category_id,
        sc.subcategorynameth as sub_category_name_th,
        sc.subcategorynameen as sub_category_name_en
       FROM brands b
       LEFT JOIN subcategories sc ON sc.subcategoryid = b.subcategoryid
    `;
    
    const params: any[] = [];
    if (subcategoryIdParam) {
      sql += ` WHERE b.subcategoryid = $1`;
      params.push(parseInt(subcategoryIdParam));
    }
    
    sql += ` ORDER BY b.brandid`;

    const result = await query(sql, params);

    return NextResponse.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error('Error fetching brands:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch brands',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// POST - Create a new brand
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { brand_name_th, brand_name_en, brand_code, sub_category_id } = body;

    // Validate required fields
    if (!brand_name_th || brand_name_th.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'Brand name (Thai) is required' },
        { status: 400 }
      );
    }

    if (!brand_name_en || brand_name_en.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'Brand name (English) is required' },
        { status: 400 }
      );
    }

    if (!brand_code || brand_code.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'Brand code is required' },
        { status: 400 }
      );
    }

    // Validate brand_code: alphanumeric only, exactly 3 characters
    const codePattern = /^[A-Z0-9]{3}$/;
    if (!codePattern.test(brand_code.trim().toUpperCase())) {
      return NextResponse.json(
        { success: false, error: 'Brand code must be exactly 3 alphanumeric characters' },
        { status: 400 }
      );
    }

    // Handle sub_category_id (optional)
    let subCategoryIdValue: number | null = null;
    if (sub_category_id && sub_category_id !== '' && sub_category_id !== null && sub_category_id !== undefined) {
      const parsed = parseInt(sub_category_id);
      if (!isNaN(parsed)) {
        subCategoryIdValue = parsed;
      }
    }

    // Insert new brand
    const result = await query(
      `INSERT INTO brands (brandnameth, brandnameen, brandcode, subcategoryid) 
       VALUES ($1, $2, $3, $4) 
       RETURNING brandid as brand_id, brandnameth as brand_name_th, brandnameen as brand_name_en, brandcode as brand_code, subcategoryid as sub_category_id`,
      [brand_name_th.trim(), brand_name_en.trim(), brand_code.trim().toUpperCase(), subCategoryIdValue]
    );

    return NextResponse.json({
      success: true,
      data: result.rows[0],
      message: 'Brand created successfully'
    });

  } catch (error: any) {
    console.error('Error creating brand:', error);
    
    // Handle unique constraint violation
    if (error.code === '23505') {
      return NextResponse.json(
        { success: false, error: 'Brand name or code already exists in this subcategory' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create brand',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// PUT - Update an existing brand
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { brand_id, brand_name_th, brand_name_en, brand_code, sub_category_id } = body;

    // Validate required fields
    if (!brand_id) {
      return NextResponse.json(
        { success: false, error: 'Brand ID is required' },
        { status: 400 }
      );
    }

    if (!brand_name_th || brand_name_th.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'Brand name (Thai) is required' },
        { status: 400 }
      );
    }

    if (!brand_name_en || brand_name_en.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'Brand name (English) is required' },
        { status: 400 }
      );
    }

    if (!brand_code || brand_code.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'Brand code is required' },
        { status: 400 }
      );
    }

    // Validate brand_code: alphanumeric only, exactly 3 characters
    const codePattern = /^[A-Z0-9]{3}$/;
    if (!codePattern.test(brand_code.trim().toUpperCase())) {
      return NextResponse.json(
        { success: false, error: 'Brand code must be exactly 3 alphanumeric characters' },
        { status: 400 }
      );
    }

    // Check if brand exists
    const existingBrand = await query(
      'SELECT brandid FROM brands WHERE brandid = $1',
      [parseInt(brand_id)]
    );

    if (existingBrand.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Brand not found' },
        { status: 404 }
      );
    }

    // Handle sub_category_id (optional)
    let subCategoryIdValue: number | null = null;
    if (sub_category_id && sub_category_id !== '' && sub_category_id !== null && sub_category_id !== undefined) {
      const parsed = parseInt(sub_category_id);
      if (!isNaN(parsed)) {
        subCategoryIdValue = parsed;
      }
    }

    // Update brand
    const result = await query(
      `UPDATE brands 
       SET brandnameth = $1, brandnameen = $2, brandcode = $3, subcategoryid = $4
       WHERE brandid = $5
       RETURNING brandid as brand_id, brandnameth as brand_name_th, brandnameen as brand_name_en, brandcode as brand_code, subcategoryid as sub_category_id`,
      [brand_name_th.trim(), brand_name_en.trim(), brand_code.trim().toUpperCase(), subCategoryIdValue, parseInt(brand_id)]
    );

    return NextResponse.json({
      success: true,
      data: result.rows[0],
      message: 'Brand updated successfully'
    });

  } catch (error: any) {
    console.error('Error updating brand:', error);
    
    // Handle unique constraint violation
    if (error.code === '23505') {
      return NextResponse.json(
        { success: false, error: 'Brand name or code already exists in this subcategory' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update brand',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// DELETE - Delete a brand
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const brand_id = searchParams.get('id');

    if (!brand_id) {
      return NextResponse.json(
        { success: false, error: 'Brand ID is required' },
        { status: 400 }
      );
    }

    // Check if brand exists
    const existingBrand = await query(
      'SELECT brandid FROM brands WHERE brandid = $1',
      [parseInt(brand_id)]
    );

    if (existingBrand.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Brand not found' },
        { status: 404 }
      );
    }

    // Check if brand is used by any products
    const productCountRes = await query(
      'SELECT COUNT(1) AS cnt FROM products WHERE brandid = $1',
      [parseInt(brand_id)]
    );
    const productCount = Number(productCountRes.rows?.[0]?.cnt || 0);
    if (productCount > 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Cannot delete: brand is in use by existing products',
          details: `There are ${productCount} product(s) using this brand.`,
        },
        { status: 409 }
      );
    }

    // Delete brand
    await query(
      'DELETE FROM brands WHERE brandid = $1',
      [parseInt(brand_id)]
    );

    return NextResponse.json({
      success: true,
      message: 'Brand deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting brand:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete brand',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

