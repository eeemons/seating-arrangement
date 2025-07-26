/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: { unoptimized: true },
  async redirects() {
    return [
      {
        source: '/',
        destination: '/shows',
        permanent: true,
      },
    ];
  },
};

module.exports = nextConfig;
