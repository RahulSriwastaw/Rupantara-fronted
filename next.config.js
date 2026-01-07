/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: [
    '*.replit.dev',
    '*.repl.co',
    '127.0.0.1',
    'localhost'
  ],
  // Use static export (Capacitor) only when NOT on Vercel, or allow standard build for Dynamic Metadata support
  output: process.env.VERCEL ? undefined : 'export',
  trailingSlash: true,
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
    unoptimized: true,
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

