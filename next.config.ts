import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: false,
  eslint: {
    ignoreDuringBuilds: true,
<<<<<<< HEAD
=======
  },
  webpack: (config) => {
    return config;
>>>>>>> 7c5837e63bb275c41b3ad26848ac85d97a35a782
  }
};

export default nextConfig;
