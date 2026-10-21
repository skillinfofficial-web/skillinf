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
    // Check maintenance mode from our own API (same server)
    const url = request.nextUrl.clone();
    url.pathname = '/api/site-settings';
    const res = await fetch(url.toString(), { next: { revalidate: 30 } });

    if (res.ok) {
      const data = await res.json();
      if (data?.settings?.maintenanceMode === true) {
        // Redirect to maintenance page
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
    /*
     * Match all paths EXCEPT:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico, public files
     */
    '/((?!_next/static|_next/image|favicon|icon|apple-touch-icon).*)',
  ],
};
