import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["http://192.168.141.118:7245"],
  async redirects() {
    return [
      {
        source: "/favicon.ico",
        destination: "/favicon-32.png",
        permanent: true,
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Link",
            value: "<https://res.cloudinary.com>; rel=preconnect; crossorigin",
          },
        ],
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/dzoupwn0e/**",
      },
    ],
  },
};

export default nextConfig;
