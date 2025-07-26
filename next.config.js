/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: { unoptimized: true },

  typescript: {
    // Ignore TypeScript errors during production builds (dangerous but useful for now)
    ignoreBuildErrors: true,
  },

  async redirects() {
    return [
      {
        source: "/",
        destination: "/shows",
        permanent: true,
      },
    ];
  },
};

module.exports = nextConfig;
