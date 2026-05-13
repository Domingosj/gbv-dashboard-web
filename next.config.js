/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
  // Disable font optimization if causing issues
  optimizeFonts: false,
  webpack: (config, { isServer }) => {
    // ...existing webpack config...
    return config;
  },
};

module.exports = nextConfig;
