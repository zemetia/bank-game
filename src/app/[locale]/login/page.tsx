import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { redirect } from '@/i18n/navigation';
import { verifyJwt } from '@/lib/jwt';
import { ParticlesBackground } from '@/components/ui/ParticlesBackground';
import { LoginPageClient } from '@/components/game/LoginPageClient';

export const metadata: Metadata = {
  title: 'Sign In',
};

interface Props {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ from?: string }>;
}

export default async function LoginPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;
  if (token && verifyJwt(token)) {
    redirect({ href: '/', locale });
  }

  const { from } = await searchParams;
  const destination = from && from.startsWith('/') ? from : '/';

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center px-4">
      <ParticlesBackground />
      <div className="relative z-10 w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-4xl font-bold tracking-tight text-foreground">
            Bank<span className="text-primary">Game</span>
          </h1>
          <p className="text-sm text-foreground-muted">Virtual bank for any board game</p>
        </div>
        <LoginPageClient destination={destination} />
      </div>
    </main>
  );
}
