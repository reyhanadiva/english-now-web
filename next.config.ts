import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  // foto contoh sementara dari Unsplash (TODO: hapus setelah semua foto asli ada di /public)
  images: { remotePatterns: [{ protocol: "https", hostname: "images.unsplash.com" }] },
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
