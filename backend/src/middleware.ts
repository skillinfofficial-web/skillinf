import { NextRequest, NextResponse } from 'next/server';

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Only guard /admin routes
  if (!pathname.startsWith('/admin')) return NextResponse.next();

  // Allow the login page itself (and its assets)
  if (pathname.startsWith('/admin/login')) return NextResponse.next();

  // Check for the session cookie ('master' or 'sub' set by login page)
  const session = req.cookies.get('admin_session');
  if (session?.value === 'master' || session?.value === 'sub') return NextResponse.next();

  // Redirect to login
  const loginUrl = req.nextUrl.clone();
  loginUrl.pathname = '/admin/login';
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ['/admin/:path*'],
};
