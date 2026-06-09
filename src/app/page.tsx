import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

import { routing } from '@/i18n/routing';
import type { Locale } from '@/i18n/routing';

function detectLocale(acceptLanguage: string | null): Locale {
  if (!acceptLanguage) return routing.defaultLocale;
  for (const locale of routing.locales) {
    if (acceptLanguage.toLowerCase().includes(locale)) return locale;
  }
  return routing.defaultLocale;
}

export default async function RootPage() {
  const headersList = await headers();
  const locale = detectLocale(headersList.get('accept-language'));
  redirect(`/${locale}`);
}
