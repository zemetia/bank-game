import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyJwt } from '@/lib/jwt';

const PUBLIC_PATHS = ['/login', '/api/auth/login', '/api/auth/register', '/api/auth/logout', '/api/health'];

export async function applyAuthGuard(request: NextRequest): Promise<NextResponse | null> {
  const { pathname } = request.nextUrl;

  // Allow public paths
  if (PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'))) {
    return null;
  }

  // Only guard page routes (not /api)
  if (pathname.startsWith('/api')) return null;

  const token = request.cookies.get('auth_token')?.value;
  if (token) {
    const payload = verifyJwt(token);
    if (payload) return null;
  }

  const loginUrl = new URL('/login', request.url);
  loginUrl.searchParams.set('from', pathname);
  return NextResponse.redirect(loginUrl);
}
