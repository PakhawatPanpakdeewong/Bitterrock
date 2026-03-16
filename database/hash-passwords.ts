import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';
import { query, closePool } from './db';
import { isBcryptHash } from './password-utils';

// Load environment variables
const envPaths = [
  path.resolve(process.cwd(), '.env.local'),
  path.resolve(process.cwd(), 'environment/.env.local')
];
for (const envPath of envPaths) {
  dotenv.config({ path: envPath });
}

/**
 * Script to hash all plain text passwords in StaffUsers table
 * Run this once to migrate existing passwords to bcrypt hashes
 * 
 * Usage: npx tsx database/hash-passwords.ts
 */
async function hashAllPasswords() {
  try {
    console.log('Starting password hashing...');

    // Get all users
    const result = await query(
      'SELECT StaffID, Email, PasswordHash FROM StaffUsers',
      []
    );

    console.log(`Found ${result.rows.length} users`);

    let hashedCount = 0;
    let skippedCount = 0;

    for (const user of result.rows) {
      const staffId = user.staffid;
      const email = user.email;
      const currentPassword = user.passwordhash;

      if (isBcryptHash(currentPassword)) {
        console.log(`User ${email} already has hashed password, skipping...`);
        skippedCount++;
        continue;
      }

      // Hash the plain text password
      const hashedPassword = await bcrypt.hash(currentPassword, 10);
      
      // Update the password in database
      await query(
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
    
    await closePool();
    process.exit(0);
  } catch (error) {
    console.error('Error hashing passwords:', error);
    await closePool();
    process.exit(1);
  }
}

// Run the script
hashAllPasswords();

