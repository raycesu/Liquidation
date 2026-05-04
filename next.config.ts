import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/apple-touch-icon.png",
        destination: "/images/liquidation-logo.png",
        permanent: false,
      },
      {
        source: "/apple-touch-icon-precomposed.png",
        destination: "/images/liquidation-logo.png",
        permanent: false,
      },
    ]
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "img.clerk.com",
        pathname: "/**",
      },
    ],
  },
}

export default nextConfig
