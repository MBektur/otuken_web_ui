import type { NextConfig } from "next";

const config: NextConfig = {
  poweredByHeader: false,
  compress: true,
  turbopack: { root: process.cwd() },
  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 31536000,
    deviceSizes: [640, 828, 1080, 1200, 1920],
    imageSizes: [128, 256, 384],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "orhunpolicycenter.com",
      },
      {
        protocol: "https",
        hostname: "otukenpolicycenter.com",
      },
      {
        protocol: "https",
        hostname: "img.youtube.com",
      },
      {
        protocol: "https",
        hostname: "i.ytimg.com",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/_next/image",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, s-maxage=31536000, immutable",
          },
        ],
      },
      {
        source: "/fonts/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },
};

export default config;
