import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
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
