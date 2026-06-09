import createMiddleware from 'next-intl/middleware';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

import { routing } from './i18n/routing';
import { applyRateLimit } from './proxy/rate-limit';
import { applySecurityHeaders } from './proxy/security-headers';
import { applyAuthGuard } from './proxy/auth-guard';

const intlMiddleware = createMiddleware(routing);

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const rateLimited = await applyRateLimit(request);
  if (rateLimited) return rateLimited;

  if (pathname === '/') {
    return applySecurityHeaders(intlMiddleware(request));
  }

  const authRedirect = await applyAuthGuard(request);
  if (authRedirect) return authRedirect;

  if (request.nextUrl.pathname.startsWith('/api')) {
    return applySecurityHeaders(NextResponse.next());
  }

  return applySecurityHeaders(intlMiddleware(request));
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)).*)',
  ],
};
