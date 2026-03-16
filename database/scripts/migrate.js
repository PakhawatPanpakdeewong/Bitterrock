/**
 * Run database migrations.
 * Usage: cd database && npm run migrate
 * Or from project root: node database/scripts/migrate.js
 */
const { Pool } = require('pg');
const dotenv = require('dotenv');
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

const { runMigration, migrations } = require('./migrate-utils');

function logMigrationResult(name, result) {
  if (result === 'skipped') {
    console.log(`⏭️  Skipping ${name}: file not found`);
  } else if (result === 'completed') {
    console.log(`✅ Migration ${name} completed`);
  } else if (result === 'already_exists') {
    console.log(`⏭️  Skipping ${name}: object already exists`);
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
      const result = await runMigration(pool, m);
      logMigrationResult(m.name, result);
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
