/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: [
    '*.replit.dev',
    '*.repl.co',
    '127.0.0.1',
    'localhost'
  ],
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
    unoptimized: false,
    formats: ['image/avif', 'image/webp'],
  },
  async rewrites() {
    // Use Railway backend URL in production, localhost in development
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://new-backend-production-ad5a.up.railway.app';
    return [
      {
        source: '/api/:path*',
        destination: `${backendUrl}/api/v1/:path*`,
      },
      {
        source: '/api/v1/:path*',
        destination: `${backendUrl}/api/v1/:path*`,
      },
    ];
  },
}

module.exports = nextConfig

