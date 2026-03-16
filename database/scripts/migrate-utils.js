/**
 * Migration helpers - exported for unit testing.
 * Used by migrate.js
 */
const fs = require('fs');
const path = require('path');

const migrations = [
  { name: 'add_fetch_logs', file: 'add_fetch_logs.sql' },
  { name: 'add_reorder_params', file: 'add_reorder_params.sql' },
  { name: 'add_staff_activity_logs', file: 'add_staff_activity_logs.sql' },
];

/**
 * Run a single migration.
 * @param {object} pool - pg Pool instance
 * @param {object} migration - { name, file }
 * @returns {Promise<'skipped'|'completed'|'already_exists'>}
 */
async function runMigration(pool, migration) {
  const sqlPath = path.join(__dirname, '..', 'migrations', migration.file);
  if (!fs.existsSync(sqlPath)) {
    return 'skipped';
  }
  const sql = fs.readFileSync(sqlPath, 'utf8');
  try {
    await pool.query(sql);
    return 'completed';
  } catch (err) {
    if (err.code === '42P07') {
      return 'already_exists';
    }
    throw err;
  }
}

module.exports = { runMigration, migrations };
