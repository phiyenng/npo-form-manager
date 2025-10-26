import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  basePath: '/zte-customers-support',
  output: 'standalone',
  trailingSlash: true,

  compress: true,
  poweredByHeader: false,
  generateEtags: false,


  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '115.78.100.151',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'http',
        hostname: '115.78.100.151',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: '*.supabase.in',
        port: '',
        pathname: '/storage/v1/object/public/**',
      }
    ],
  },

};

export default nextConfig;
