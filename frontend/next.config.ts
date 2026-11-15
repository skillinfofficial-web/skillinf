import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  compress: true,
  images: {
    dangerouslyAllowSVG: true,
    remotePatterns: [],
    formats: ['image/webp'],          // serve WebP by default
    minimumCacheTTL: 31536000,        // cache images for 1 year
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
  },
  async headers() {
    return [
      /* ── Static pages — cache at Cloudflare CDN for 1 hour ── */
      {
        source: '/:path(about|terms|privacy-policy|careers|services|services/website|services/ai-automation|services/ui-ux-design|services/3d-design)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400' },
        ],
      },
      /* ── All routes — security headers ── */
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com https://*.cashfree.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' data: https://fonts.gstatic.com",
              "img-src 'self' data: https: blob:",
              "connect-src 'self' https://www.google-analytics.com https://analytics.google.com https://*.cashfree.com",
              "frame-src 'self' https://*.cashfree.com https://www.youtube.com https://www.youtube-nocookie.com",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
