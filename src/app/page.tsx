import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { verifyJwt } from '@/lib/jwt';
import { ParticlesBackground } from '@/components/ui/ParticlesBackground';
import { JoinForm } from '@/components/game/JoinForm';
import { LogoutButton } from '@/components/game/LogoutButton';

export const metadata: Metadata = {
  title: 'BankGame — Virtual Bank Simulator',
  description: 'Create a shared virtual bank for your game. Track balances, transfers, and transactions for every player in the room.',
};

export default async function HomePage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;
  const user = token ? verifyJwt(token) : null;

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center px-4">
      <ParticlesBackground />

      <div className="relative z-10 w-full max-w-sm">
        {/* Brand */}
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-4xl font-bold tracking-tight text-foreground">
            Bank<span className="text-primary">Game</span>
          </h1>
          {user && (
            <p className="text-sm text-foreground-muted">
              Signed in as <span className="font-medium text-foreground">{user.name}</span>
            </p>
          )}
        </div>

        {/* Join card */}
        <div className="rounded-2xl border border-border bg-surface/80 p-6 backdrop-blur-sm shadow-xl">
          <p className="mb-5 text-center text-sm font-medium text-foreground-muted">
            Enter a room code to join
          </p>
          <JoinForm />
        </div>

        {/* Create CTA */}
        <div className="mt-6 flex flex-col items-center gap-3">
          <div className="flex w-full items-center gap-3">
            <span className="h-px flex-1 bg-border" />
            <span className="text-xs text-foreground-subtle">or</span>
            <span className="h-px flex-1 bg-border" />
          </div>
          <Link
            href="/create"
            className="inline-flex h-10 w-full items-center justify-center rounded-md border border-border bg-transparent px-6 text-sm font-medium text-foreground transition-colors hover:bg-surface hover:border-border-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            + Create New Room
          </Link>
        </div>

        <div className="mt-6 flex justify-center">
          <LogoutButton />
        </div>
      </div>
    </main>
  );
}
