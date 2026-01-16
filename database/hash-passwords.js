const bcrypt = require('bcryptjs');
const { Pool } = require('pg');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
const envPaths = [
  path.resolve(process.cwd(), '.env.local'),
  path.resolve(process.cwd(), 'environment/.env.local')
];
for (const envPath of envPaths) {
  dotenv.config({ path: envPath });
}

// Database connection configuration
const dbConfig = {
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
};

// SSL Configuration
if (process.env.DB_SSL === 'true') {
  dbConfig.ssl = {
    rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false',
  };
} else {
  dbConfig.ssl = false;
}

// Create a connection pool
const pool = new Pool(dbConfig);

/**
 * Script to hash all plain text passwords in StaffUsers table
 * Run this once to migrate existing passwords to bcrypt hashes
 * 
 * Usage: node database/hash-passwords.js
 */
async function hashAllPasswords() {
  const client = await pool.connect();
  try {
    console.log('Starting password hashing...');

    // Get all users
    const result = await client.query(
      'SELECT StaffID, Email, PasswordHash FROM StaffUsers'
    );

    console.log(`Found ${result.rows.length} users`);

    let hashedCount = 0;
    let skippedCount = 0;

    for (const user of result.rows) {
      const staffId = user.staffid;
      const email = user.email;
      const currentPassword = user.passwordhash;

      // Check if password is already a bcrypt hash (starts with $2a$, $2b$, or $2y$)
      if (currentPassword && (
          currentPassword.startsWith('$2a$') || 
          currentPassword.startsWith('$2b$') || 
          currentPassword.startsWith('$2y$'))) {
        console.log(`User ${email} already has hashed password, skipping...`);
        skippedCount++;
        continue;
      }

      // Hash the plain text password
      const hashedPassword = await bcrypt.hash(currentPassword, 10);
      
      // Update the password in database
      await client.query(
        'UPDATE StaffUsers SET PasswordHash = $1 WHERE StaffID = $2',
        [hashedPassword, staffId]
      );

      console.log(`✓ Hashed password for user: ${email}`);
      hashedCount++;
    }

    console.log('\n=== Summary ===');
    console.log(`Total users: ${result.rows.length}`);
    console.log(`Hashed: ${hashedCount}`);
    console.log(`Skipped (already hashed): ${skippedCount}`);
    console.log('Password hashing completed!');
    
  } catch (error) {
    console.error('Error hashing passwords:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
    process.exit(0);
  }
}

// Run the script
hashAllPasswords();

