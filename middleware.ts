import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const sessionCookie = request.cookies.get('swiggy-verify-session');
  const { pathname } = request.nextUrl;

  // Public routes that don't need session
  const publicRoutes = ['/success', '/error-page', '/api/auth'];
  const isPublic = publicRoutes.some((route) => pathname.startsWith(route));

  if (isPublic) {
    return NextResponse.next();
  }

  // Protected routes: / and /verify-otp
  if (!sessionCookie) {
    if (pathname === '/verify-otp') {
      return NextResponse.redirect(
        new URL('/error-page?type=session_expired', request.url)
      );
    }
    // Main page — redirect to Discord OAuth
    return NextResponse.redirect(new URL('/api/auth/discord', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/verify-otp'],
};
