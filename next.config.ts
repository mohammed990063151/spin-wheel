import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
  images: {
    qualities: [65, 75, 82, 90],
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60 * 60 * 24,
    deviceSizes: [420, 640, 768, 1024, 1280, 1536, 1920],
    imageSizes: [96, 256, 384, 512, 640, 768],
    remotePatterns: [
      { protocol: "https", hostname: "enala.sa" },
      { protocol: "https", hostname: "www.enala.sa" },
      { protocol: "https", hostname: "**.enala.sa" },
      { protocol: "https", hostname: "place.sa" },
      { protocol: "https", hostname: "www.place.sa" },
      { protocol: "https", hostname: "**.place.sa" },
    ],
  },
};

export default nextConfig;
