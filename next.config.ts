import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  basePath: '/zte-customers-support',
  output: 'standalone',
  trailingSlash: true,

  compress: true,
  poweredByHeader: false,
  generateEtags: false,
};

export default nextConfig;
