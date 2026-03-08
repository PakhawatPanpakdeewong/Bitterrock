import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';
import { query, closePool } from './db';

// Load environment variables
const envPaths = [
  path.resolve(process.cwd(), '.env.local'),
  path.resolve(process.cwd(), 'environment/.env.local')
];
for (const envPath of envPaths) {
  dotenv.config({ path: envPath });
}

/**
 * Script to add a new user to StaffUsers table
 * Usage: npx tsx database/add-user.ts
 */
async function addUser() {
  const username = 'tester01';
  const email = 'tester01@gmail.com';
  const password = '1140150470';
  const role = 'staff';

  try {
    // Check if user already exists
    const existing = await query(
      'SELECT StaffID FROM StaffUsers WHERE Username = $1 OR Email = $2',
      [username, email]
    );

    if (existing.rows.length > 0) {
      console.log(`User ${username} or ${email} already exists. Skipping.`);
      await closePool();
      process.exit(0);
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);

    await query(
      `INSERT INTO StaffUsers (Username, Email, PasswordHash, StaffRole, StaffStatus)
       VALUES ($1, $2, $3, $4, 'active')`,
      [username, email, passwordHash, role]
    );

    console.log(`✓ Added user: ${username} (${email})`);
    await closePool();
    process.exit(0);
  } catch (error) {
    console.error('Error adding user:', error);
    await closePool();
    process.exit(1);
  }
}

addUser();
