import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Vercel's image optimizer has a monthly quota; once it is used up every photo returns
    // "402 Payment required" and the whole site shows broken images. Serving the photos
    // straight from Cloudflare R2 avoids that limit entirely.
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'pub-209a4e728df44d029c946408e718e9c8.r2.dev',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
