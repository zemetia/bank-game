# i18n — 01: Config, Messages, Translations, Metadata

← [I18N.md](../I18N.md) | [Blueprint INDEX](../INDEX.md) | [02 — Navigation, static gen, locales →](./02-navigation-static-locales.md)

---

## Configuration Files

| File | Export / Purpose |
|---|---|
| [src/i18n/routing.ts](../../../src/i18n/routing.ts) | `routing` — `defineRouting({ locales, defaultLocale, localePrefix })` |
| [src/i18n/navigation.ts](../../../src/i18n/navigation.ts) | `Link`, `redirect`, `usePathname`, `useRouter`, `getPathname` |
| [src/i18n/request.ts](../../../src/i18n/request.ts) | `getRequestConfig` — loads message JSON per locale per RSC render |
| [middleware.ts](../../../middleware.ts) | `createMiddleware(routing)` — locale detection + redirect |
| [messages/](../../../messages/) | JSON translation files per locale |

---

## Routing Config (src/i18n/routing.ts)

```ts
export const routing = defineRouting({
  locales: ['en', 'id'] as const,
  defaultLocale: 'en',
  localePrefix: 'as-needed',
  // default locale: /about (no prefix)
  // other locales:  /id/about (prefixed)
});

export type Locale = (typeof routing.locales)[number];  // 'en' | 'id'
```

---

## Middleware (middleware.ts)

```ts
import createMiddleware from 'next-intl/middleware';
import { routing } from './src/i18n/routing';

export default createMiddleware(routing);

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
```

Behavior: reads `Accept-Language` → sets locale cookie → redirects to locale-prefixed path for non-default locales.

---

## Message Files (messages/)

| Path | Namespace key |
|---|---|
| [messages/en/common.json](../../../messages/en/common.json) | `common` |
| [messages/en/navigation.json](../../../messages/en/navigation.json) | `navigation` |
| [messages/en/home.json](../../../messages/en/home.json) | `home` |
| [messages/id/common.json](../../../messages/id/common.json) | `common` |
| [messages/id/navigation.json](../../../messages/id/navigation.json) | `navigation` |
| [messages/id/home.json](../../../messages/id/home.json) | `home` |

Namespace key = JSON filename without extension. Loaded in `src/i18n/request.ts`:

```ts
return {
  locale,
  messages: {
    common:     (await import(`../../messages/${locale}/common.json`)).default,
    navigation: (await import(`../../messages/${locale}/navigation.json`)).default,
    home:       (await import(`../../messages/${locale}/home.json`)).default,
  },
};
```

---

## useTranslations (Server + Client)

`useTranslations` is isomorphic — same API in Server and Client Components.

```tsx
// Server Component
import { useTranslations } from 'next-intl';
export default function HomePage() {
  const t = useTranslations('home');
  return <h1>{t('hero.title')}</h1>;
}

// Client Component
'use client';
import { useTranslations } from 'next-intl';
export function Header() {
  const t = useTranslations('navigation');
  return <span>{t('home')}</span>;
}
```

Messages flow: Server layout → `NextIntlClientProvider` `messages` prop → client tree.

---

## generateMetadata

```ts
import { getTranslations } from 'next-intl/server';

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'home.meta' });
  return {
    title: { template: `%s | ${t('title')}`, default: t('title') },
    description: t('description'),
  };
}
```

`getTranslations` = async server-only counterpart to `useTranslations`. Use in `generateMetadata` and `generateStaticParams` only.

---

← [I18N.md](../I18N.md) | → [02 — Navigation, static gen, locales](./02-navigation-static-locales.md)
