import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ['10.90.182.40'],
  /* config options here */
  experimental: {
    // Ensuring the root is correctly resolved
  }
};

export default nextConfig;
