import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
    async rewrites() {
    return [
      {
        source: "/backend/:path*",
        destination: "http://localhost:3001/:path*"
      },
    ];
  },
};

export default nextConfig;
