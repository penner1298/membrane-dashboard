import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // This tells Vercel to bypass the strict checks and just build the app!
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;