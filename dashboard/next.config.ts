import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Explicitly acknowledge Turbopack so Next 16 accepts the dev-only Webpack watcher config below.
  turbopack: {},

  // Robust file watching for macOS + Google Drive File Stream / network filesystems.
  webpack: (config, { dev }) => {
    if (dev) {
      config.watchOptions = {
        poll: 1200,
        aggregateTimeout: 400,
        ignored: /node_modules/,
      };
    }
    return config;
  },
};

export default nextConfig;
