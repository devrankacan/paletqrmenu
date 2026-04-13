import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Allow images from any domain for product photos
  images: {
    remotePatterns: [{ protocol: 'https', hostname: '**' }, { protocol: 'http', hostname: '**' }],
  },
  // Silence the better-sqlite3 native module warning
  serverExternalPackages: ['better-sqlite3'],
};

export default nextConfig;
