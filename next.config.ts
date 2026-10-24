import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(self)" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  async redirects() {
    // www → apex, so there is one canonical domain for SEO.
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.czechpexeso.net" }],
        destination: "https://czechpexeso.net/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
