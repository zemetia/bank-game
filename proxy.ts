import createMiddleware from 'next-intl/middleware';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

import { routing } from './src/i18n/routing';
import { applyRateLimit } from './src/proxy/rate-limit';
import { applySecurityHeaders } from './src/proxy/security-headers';
import { applyAuthGuard } from './src/proxy/auth-guard';

const intlMiddleware = createMiddleware(routing);

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Rate limit — returns 429 early for /api/* if threshold exceeded
  const rateLimited = await applyRateLimit(request);
  if (rateLimited) return rateLimited;

  // Bare root → let intlMiddleware redirect to /{locale} before auth guard runs
  if (pathname === '/') {
    return applySecurityHeaders(intlMiddleware(request));
  }

  // Auth guard — redirect unauthenticated users to /login
  const authRedirect = await applyAuthGuard(request);
  if (authRedirect) return authRedirect;

  // API routes — skip intl routing, only security headers
  if (request.nextUrl.pathname.startsWith('/api')) {
    return applySecurityHeaders(NextResponse.next());
  }

  // Page routes — intl locale routing + security headers
  return applySecurityHeaders(intlMiddleware(request));
}

export const config = {
  matcher: [
    // All routes except static assets — /api is included so rate limiting applies
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)).*)',
  ],
};
