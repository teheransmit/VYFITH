import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  distDir: process.env.NODE_ENV === 'development' ? '.next-dev' : '.next',
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  // Allow access to remote image placeholder.
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**', // This allows any path under the hostname
      },
    ],
  },
  output: process.env.NEXT_STANDALONE === 'true' ? 'standalone' : undefined,
  transpilePackages: ['motion'],
  async redirects() {
    return [
      {
        source: '/api/v0/:path*',
        destination: '/api/sync/health',
        permanent: false,
      },
      {
        source: '/v1/health/:path*',
        destination: '/api/sync/health',
        permanent: false,
      },
      {
        source: '/v1/sync/:path*',
        destination: '/api/sync/health',
        permanent: false,
      },
      {
        source: '/api/legacy/health',
        destination: '/api/sync/health',
        permanent: false,
      },
      {
        source: '/api/health-check',
        destination: '/api/sync/health',
        permanent: false,
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: '/ingest/health',
        destination: '/api/sync/health',
      },
      {
        source: '/ingest',
        destination: '/api/sync/health',
      },
      {
        source: '/sync/health',
        destination: '/api/sync/health',
      },
      {
        source: '/health/sync',
        destination: '/api/sync/health',
      },
      {
        source: '/health',
        destination: '/api/sync/health',
      },
    ];
  },
  webpack: (config, {dev}) => {
    // HMR is disabled in AI Studio via DISABLE_HMR env var.
    // Do not modify—file watching is disabled to prevent flickering during agent edits.
    if (dev && process.env.DISABLE_HMR === 'true') {
      config.watchOptions = {
        ignored: /.*/,
      };
    }
    return config;
  },
};

export default nextConfig;
