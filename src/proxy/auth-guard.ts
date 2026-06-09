import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyJwt } from '@/lib/jwt';
import { routing } from '@/i18n/routing';
import type { Locale } from '@/i18n/routing';

const PUBLIC_PAGE_PATHS = ['/login'];

function withoutLocale(pathname: string): string {
  for (const locale of routing.locales) {
    if (pathname === `/${locale}`) return '/';
    if (pathname.startsWith(`/${locale}/`)) return pathname.slice(locale.length + 1);
  }
  return pathname;
}

function detectLocale(request: NextRequest): Locale {
  const { pathname } = request.nextUrl;
  for (const locale of routing.locales) {
    if (pathname === `/${locale}` || pathname.startsWith(`/${locale}/`)) return locale;
  }
  const cookieLocale = request.cookies.get('NEXT_LOCALE')?.value;
  if (cookieLocale && (routing.locales as readonly string[]).includes(cookieLocale)) {
    return cookieLocale as Locale;
  }
  const acceptLang = request.headers.get('accept-language') ?? '';
  for (const locale of routing.locales) {
    if (acceptLang.toLowerCase().includes(locale)) return locale;
  }
  return routing.defaultLocale;
}

export async function applyAuthGuard(request: NextRequest): Promise<NextResponse | null> {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith('/api')) return null;

  const normalized = withoutLocale(pathname);
  if (PUBLIC_PAGE_PATHS.some((p) => normalized === p || normalized.startsWith(`${p}/`))) return null;

  const token = request.cookies.get('auth_token')?.value;
  if (token && verifyJwt(token)) return null;

  const locale = detectLocale(request);
  const loginUrl = new URL(`/${locale}/login`, request.url);
  loginUrl.searchParams.set('from', pathname);
  return NextResponse.redirect(loginUrl);
}
