const fs = require('fs');
const path = require('path');

// Load env from environment/.env.local or environment/.env
(() => {
  const envLocalPath = path.join(__dirname, 'environment', '.env.local');
  const envPath = path.join(__dirname, 'environment', '.env');
  const chosenPath = fs.existsSync(envLocalPath) ? envLocalPath : (fs.existsSync(envPath) ? envPath : null);
  if (chosenPath) {
    require('dotenv').config({ path: chosenPath });
  }
})();

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
};

module.exports = nextConfig;

