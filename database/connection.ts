import { Pool } from 'pg';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from common locations, without failing if one path is missing
const envPaths = [
  path.resolve(process.cwd(), '.env.local'),
  path.resolve(process.cwd(), 'environment/.env.local')
];
for (const envPath of envPaths) {
  dotenv.config({ path: envPath });
}

let pool: Pool | null = null;

function buildDbConfig() {
  return {
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: process.env.DB_SSL === 'true'
  };
}

function validateEnv() {
  const requiredEnvVars = ['DB_HOST', 'DB_PORT', 'DB_NAME', 'DB_USER', 'DB_PASSWORD'];
  const missingEnvVars = requiredEnvVars.filter((envVar) => !process.env[envVar]);
  if (missingEnvVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
  }
}

export function getPool(): Pool {
  if (!pool) {
    validateEnv();
    const dbConfig = buildDbConfig();
    pool = new Pool({
      ...dbConfig,
      max: 20, // Maximum number of clients in the pool
      idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
      connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection could not be established
    });
  }
  return pool;
}

// Test the database connection (call manually if needed)
export async function testConnection() {
  try {
    const client = await getPool().connect();
    console.log('✅ Database connected successfully');
    client.release();
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  }
}

// Execute a query
export async function query(text: string, params?: any[]) {
  const client = await getPool().connect();
  try {
    const result = await client.query(text, params);
    return result;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Close the pool
export async function closePool() {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

export default getPool;
