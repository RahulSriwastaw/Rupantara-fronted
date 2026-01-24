/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: [
    '*.replit.dev',
    '*.repl.co',
    '127.0.0.1',
    'localhost'
  ],
  // Only use static export when specifically requested (e.g. for Capacitor builds)
  // This allows Next.js Image Optimization to work in Dev and on Vercel/Standard Servers
  output: process.env.NEXT_EXPORT === 'true' ? 'export' : undefined,
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
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
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

