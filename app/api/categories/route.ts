import { NextRequest, NextResponse } from 'next/server';
import { query } from '../../../database/connection';

export async function GET(request: NextRequest) {
  try {
    // First, let's check what tables exist in the database
    const tablesResult = await query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);

    console.log('Available tables:', tablesResult.rows);

    // Look for a categories table (case-insensitive)
    const categoriesTableQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND LOWER(table_name) LIKE '%categor%'
      ORDER BY table_name;
    `;

    const categoriesTableResult = await query(categoriesTableQuery);
    console.log('Category-related tables:', categoriesTableResult.rows);

    if (categoriesTableResult.rows.length === 0) {
      // If no categories table exists, let's check if there's a Products table with categories
      const productsTableQuery = `
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND LOWER(table_name) = 'products'
        ORDER BY ordinal_position;
      `;

      const productsColumnsResult = await query(productsTableQuery);
      console.log('Products table columns:', productsColumnsResult.rows);

      if (productsColumnsResult.rows.length > 0) {
        // Check if there's a Category column in Products table
        const hasCategoryColumn = productsColumnsResult.rows.some(
          (row: any) => row.column_name.toLowerCase().includes('categor')
        );

        if (hasCategoryColumn) {
          // Get unique categories from Products table
          const categoriesFromProducts = await query(`
            SELECT DISTINCT category as category_name, 
                   COUNT(*) as product_count,
                   MIN(created_at) as created_date
            FROM products 
            WHERE category IS NOT NULL 
            GROUP BY category 
            ORDER BY category;
          `);

          return NextResponse.json({
            success: true,
            data: categoriesFromProducts.rows.map((row: any, index: number) => ({
              category_id: index + 1,
              category_name: row.category_name,
              description: `${row.product_count} products in this category`,
              created_date: row.created_date || new Date().toISOString().split('T')[0]
            })),
            source: 'products_table'
          });
        }
      }

      // If no categories found anywhere, return empty array
      return NextResponse.json({
        success: true,
        data: [],
        message: 'No categories table found. Please create a categories table or add category data to products table.',
        available_tables: tablesResult.rows.map((row: any) => row.table_name)
      });
    }

    // If categories table exists, fetch from it
    const tableName = categoriesTableResult.rows[0].table_name;
    
    // Get column information for the categories table
    const columnsResult = await query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = $1
      ORDER BY ordinal_position;
    `, [tableName]);

    console.log(`Columns in ${tableName}:`, columnsResult.rows);

    // Build dynamic query based on available columns
    const columns = columnsResult.rows.map((row: any) => row.column_name);
    
    // Try to map columns to our expected structure
    let selectQuery = `SELECT * FROM ${tableName} ORDER BY `;
    
    // Add ordering based on available columns
    if (columns.includes('id')) {
      selectQuery += 'id';
    } else if (columns.includes('category_id')) {
      selectQuery += 'category_id';
    } else if (columns.includes('created_at')) {
      selectQuery += 'created_at';
    } else {
      selectQuery += columns[0];
    }

    const categoriesResult = await query(selectQuery);
    
    // Map the results to our expected format
    const mappedCategories = categoriesResult.rows.map((row: any, index: number) => {
      return {
        category_id: row.id || row.category_id || index + 1,
        category_name: row.name || row.category_name || row.title || 'Unnamed Category',
        description: row.description || row.desc || 'No description available',
        created_date: row.created_at || row.created_date || row.date_created || new Date().toISOString().split('T')[0]
      };
    });

    return NextResponse.json({
      success: true,
      data: mappedCategories,
      source: tableName,
      columns: columns
    });

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
