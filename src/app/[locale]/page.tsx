import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { buildMetadata } from '@/lib/seo';
import { HomeLanding } from '@/components/game/HomeLanding';

interface Props {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'game.meta' });
  return buildMetadata({ title: t('title'), description: t('description'), path: '/', locale });
}

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'game.home' });

  return (
    <main className="bg-[--color-background]">
      <HomeLanding
        headline={t('headline')}
        sub={t('sub')}
        createLabel={t('createRoom')}
        createTitle={t('createRoom')}
      />
    </main>
  );
}
