import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Sub-path deployment: masadamenu.com.tr/paletpastanesi
  basePath: process.env.BASE_PATH || '',
  assetPrefix: process.env.BASE_PATH || '',

  // Allow images from any domain for product photos
  images: {
    remotePatterns: [{ protocol: 'https', hostname: '**' }, { protocol: 'http', hostname: '**' }],
  },
  // Silence the better-sqlite3 native module warning
  serverExternalPackages: ['better-sqlite3', 'sharp'],
};

export default nextConfig;
