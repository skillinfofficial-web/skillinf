import { NextRequest, NextResponse } from 'next/server';

// Pages that are ALWAYS accessible even during maintenance
const ALLOWED_PATHS = [
  '/maintenance',
  '/sign-in',
  '/admin',
  '/api/',
  '/_next/',
  '/favicon',
  '/icon',
  '/apple-touch-icon',
  '/robots.txt',
  '/sitemap.xml',
];

// Use the backend Render URL — Cloudflare Workers cannot self-fetch their own
// origin (causes a WORKER_SELF_REFERENCE error), so we call the backend API
// which connects to the same MongoDB database.
const BACKEND_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://skillinf-backend.onrender.com';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Always allow admin, maintenance page itself, and internal Next.js/API paths
  if (ALLOWED_PATHS.some(p => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  try {
    // Fetch site settings from the backend (Render) — avoids Cloudflare
    // Worker self-reference restriction when calling the same-origin API.
    const res = await fetch(`${BACKEND_URL}/api/site-settings`, {
      headers: { 'cache-control': 'no-store' },
      // 3-second timeout so a slow Render cold-start doesn't block every request
      signal: AbortSignal.timeout(3000),
    });

    if (res.ok) {
      const data = await res.json();
      if (data?.settings?.maintenanceMode === true) {
        const maintenanceUrl = request.nextUrl.clone();
        maintenanceUrl.pathname = '/maintenance';
        return NextResponse.redirect(maintenanceUrl);
      }
    }
  } catch {
    // If the backend is unreachable, fail-open (let traffic through)
    // so a backend outage never takes down the frontend
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon|icon|apple-touch-icon).*)',
  ],
};
