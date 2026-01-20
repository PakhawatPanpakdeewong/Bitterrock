const fs = require('fs');
const path = require('path');

// Load env from environment/.env.local or environment/.env
// Only load in development, production should use environment variables
if (process.env.NODE_ENV !== 'production') {
  (() => {
    const envLocalPath = path.join(__dirname, 'environment', '.env.local');
    const envPath = path.join(__dirname, 'environment', '.env');
    const chosenPath = fs.existsSync(envLocalPath) ? envLocalPath : (fs.existsSync(envPath) ? envPath : null);
    if (chosenPath) {
      require('dotenv').config({ path: chosenPath });
    }
  })();
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone', // Enable standalone output for Docker
  
  // Performance optimizations for development
  experimental: {
    // Optimize package imports to reduce bundle size
    optimizePackageImports: [
      'lucide-react',
      '@radix-ui/react-select',
      '@radix-ui/react-slot',
    ],
    // CSS optimization disabled - critters package is deprecated
    // optimizeCss: true,
  },
  
  // Compiler optimizations
  compiler: {
    // Remove console logs in production
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },
  
  // Headers for font preloading
  async headers() {
    return [
      {
        source: '/fonts/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
  
  // Webpack optimizations
  webpack: (config, { dev, isServer }) => {
    // Faster builds in development
    if (dev && !isServer) {
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
      };
    }
    return config;
  },
};

module.exports = nextConfig;

