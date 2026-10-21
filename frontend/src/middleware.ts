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

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Always allow admin, maintenance page itself, and internal Next.js/API paths
  if (ALLOWED_PATHS.some(p => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  try {
    // Build absolute URL to the site-settings API on the same origin
    const apiUrl = new URL('/api/site-settings', request.nextUrl.origin);
    const res    = await fetch(apiUrl.toString(), {
      // Bypass edge cache — we want the live value from MongoDB
      headers: { 'cache-control': 'no-store' },
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
    // If check fails, allow traffic through (fail-open)
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon|icon|apple-touch-icon).*)',
  ],
};
