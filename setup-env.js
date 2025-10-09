#!/usr/bin/env node

/**
 * Environment Setup Script for Bitterrock Application
 * This script helps you create the .env.local file with proper database configuration
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function setupEnvironment() {
  console.log('🔧 Bitterrock Environment Setup\n');
  console.log('This script will help you create a .env.local file for your database configuration.\n');

  try {
    // Check if .env.local already exists
    const envPath = path.join(process.cwd(), '.env.local');
    if (fs.existsSync(envPath)) {
      const overwrite = await question('⚠️  .env.local already exists. Do you want to overwrite it? (y/N): ');
      if (overwrite.toLowerCase() !== 'y' && overwrite.toLowerCase() !== 'yes') {
        console.log('❌ Setup cancelled.');
        rl.close();
        return;
      }
    }

    console.log('📋 Please provide your database configuration:\n');

    const dbHost = await question('Database Host (default: localhost): ') || 'localhost';
    const dbPort = await question('Database Port (default: 5432): ') || '5432';
    const dbName = await question('Database Name (default: bitterrock_db): ') || 'bitterrock_db';
    const dbUser = await question('Database User (default: postgres): ') || 'postgres';
    const dbPassword = await question('Database Password (default: password): ') || 'password';
    const dbSsl = await question('Use SSL? (y/N): ');
    const useSsl = dbSsl.toLowerCase() === 'y' || dbSsl.toLowerCase() === 'yes';

    const envContent = `# Database Configuration
DB_HOST=${dbHost}
DB_PORT=${dbPort}
DB_NAME=${dbName}
DB_USER=${dbUser}
DB_PASSWORD=${dbPassword}
DB_SSL=${useSsl}

# Next.js Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000

# R2 Configuration (for file uploads) - Optional
# R2_ACCOUNT_ID=your_r2_account_id
# R2_ACCESS_KEY_ID=your_r2_access_key
# R2_SECRET_ACCESS_KEY=your_r2_secret_key
# R2_BUCKET_NAME=your_r2_bucket_name
# R2_PUBLIC_URL=https://your_r2_bucket_name.r2.cloudflarestorage.com
`;

    fs.writeFileSync(envPath, envContent);
    console.log('\n✅ .env.local file created successfully!');
    
    console.log('\n📝 Next steps:');
    console.log('1. Make sure PostgreSQL is installed and running');
    console.log('2. Run the database setup script:');
    console.log('   cd database && node setup-db.js');
    console.log('3. Restart your Next.js development server:');
    console.log('   npm run dev');
    console.log('\n🎉 Your application should now work properly!');

  } catch (error) {
    console.error('❌ Setup failed:', error.message);
  } finally {
    rl.close();
  }
}

// Run setup if this script is executed directly
if (require.main === module) {
  setupEnvironment().catch(console.error);
}

module.exports = { setupEnvironment };

