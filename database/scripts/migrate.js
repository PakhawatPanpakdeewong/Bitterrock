/**
 * Run database migrations.
 * Usage: cd database && npm run migrate
 * Or from project root: node database/scripts/migrate.js
 */
const { Pool } = require('pg');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

// Resolve project root (parent of database/)
const projectRoot = path.resolve(__dirname, '../..');
const envPath = path.join(projectRoot, 'environment', '.env.local');

dotenv.config({ path: envPath });

const dbConfig = {
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
};

if (process.env.DB_SSL === 'true') {
  dbConfig.ssl = { rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false' };
} else {
  dbConfig.ssl = false;
}

const migrations = [
  { name: 'add_fetch_logs', file: 'add_fetch_logs.sql' },
  { name: 'add_reorder_params', file: 'add_reorder_params.sql' },
];

async function runMigration(pool, migration) {
  const sqlPath = path.join(__dirname, '..', 'migrations', migration.file);
  if (!fs.existsSync(sqlPath)) {
    console.log(`⏭️  Skipping ${migration.name}: ${migration.file} not found`);
    return;
  }
  const sql = fs.readFileSync(sqlPath, 'utf8');
  try {
    await pool.query(sql);
    console.log(`✅ Migration ${migration.name} completed`);
  } catch (err) {
    if (err.code === '42P07') {
      console.log(`⏭️  Skipping ${migration.name}: object already exists`);
    } else {
      throw err;
    }
  }
}

async function main() {
  const required = ['DB_HOST', 'DB_NAME', 'DB_USER', 'DB_PASSWORD'];
  const missing = required.filter((k) => !process.env[k]);
  if (missing.length) {
    console.error('❌ Missing env:', missing.join(', '));
    console.error('   Ensure environment/.env.local exists with DB_* variables');
    process.exit(1);
  }

  const pool = new Pool(dbConfig);
  try {
    console.log('Running migrations...');
    for (const m of migrations) {
      await runMigration(pool, m);
    }
    console.log('Done.');
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
