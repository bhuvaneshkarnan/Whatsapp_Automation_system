/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://168.138.172.197/api/:path*',
      },
      {
        source: '/webhooks/:path*',
        destination: 'http://168.138.172.197/webhooks/:path*',
      },
    ];
  },
};

export default nextConfig;
