import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { query } from '../../database/connection';

// Load environment variables
dotenv.config({ path: '../environment/.env.local' });

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Categories API endpoint
app.get('/api/categories', async (req, res) => {
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
      return res.json({
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

    res.json({
      success: true,
      data: mappedCategories,
      source: tableName,
      columns: columns
    });

  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch categories',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Backend server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`📋 Categories API: http://localhost:${PORT}/api/categories`);
});

export default app;
