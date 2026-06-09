# i18n — 02: Navigation, Static Generation, Locale Switcher, Pluralization

← [01 — Config, translations](./01-config-translations.md) | [I18N.md](../I18N.md) | [Blueprint INDEX](../INDEX.md)

---

## Navigation — CRITICAL RULE

**Never import from `next/navigation`.** Always use [src/i18n/navigation.ts](../../../src/i18n/navigation.ts).

```ts
// src/i18n/navigation.ts
export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
```

```tsx
// ✅
import { Link, useRouter, usePathname } from '@/i18n/navigation';

<Link href="/about">About</Link>       // renders /id/about for Indonesian users
router.push('/dashboard');             // locale-prefixed automatically
const path = usePathname();            // strips locale prefix: /id/about → /about

// ❌ next/navigation — no locale context
import { Link } from 'next/link';
import { useRouter } from 'next/navigation';
```

---

## Static Generation

`src/app/[locale]/layout.tsx` already has:

```ts
export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}
```

Dynamic sub-routes need their own:

```ts
// src/app/[locale]/blog/[slug]/page.tsx
export async function generateStaticParams() {
  const posts = await blogService.list();
  return routing.locales.flatMap((locale) =>
    posts.map((post) => ({ locale, slug: post.slug })),
  );
}
```

---

## Locale Switcher Pattern ([src/components/shared/LanguageSwitcher/](../../../src/components/shared/LanguageSwitcher/))

```tsx
'use client';
import { useLocale } from 'next-intl';
import { useRouter, usePathname } from '@/i18n/navigation';
import { routing } from '@/i18n/routing';

const locale   = useLocale();
const router   = useRouter();
const pathname = usePathname();

const handleChange = (nextLocale: string) => {
  router.replace(pathname, { locale: nextLocale });
  // same path, different locale — no full page reload
};
```

---

## Pluralization (ICU format)

```json
{ "items": "{count, plural, =0 {No items} one {# item} other {# items}}" }
```

```ts
t('items', { count: 3 })  // "3 items"
```

---

## Adding a New Locale

| Step | Action |
|---|---|
| 1 | Add locale string to `locales` array in [src/i18n/routing.ts](../../../src/i18n/routing.ts) |
| 2 | Create `messages/<locale>/common.json`, `navigation.json`, `home.json` |
| 3 | Done — middleware and `generateStaticParams` auto-handle the rest |

---

## Adding a New Namespace

| Step | Action |
|---|---|
| 1 | Create `messages/en/<namespace>.json` and `messages/id/<namespace>.json` |
| 2 | Add `namespace: (await import(...)).default` to [src/i18n/request.ts](../../../src/i18n/request.ts) |
| 3 | Use `useTranslations('<namespace>')` in components |

---

← [01 — Config, translations](./01-config-translations.md) | [I18N.md](../I18N.md)
