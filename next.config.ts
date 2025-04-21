import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: false,
  eslint: {
    ignoreDuringBuilds: true,
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      'swagger-ui-react': require.resolve('swagger-ui-react')
    };
    return config;
  }
};

export default nextConfig;
