import type { Metadata } from 'next';
import Link from 'next/link';
import { RoomForm } from '@/components/game/RoomForm';
import { ParticlesBackground } from '@/components/ui/ParticlesBackground';

export const metadata: Metadata = {
  title: 'Create Room — BankGame',
  description: 'Create a new virtual bank room for your game.',
};

export default function CreateRoomPage() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center px-4">
      <ParticlesBackground />

      <div className="relative z-10 w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-4xl font-bold tracking-tight text-foreground">
            Bank<span className="text-primary">Game</span>
          </h1>
          <p className="text-sm text-foreground-muted">Create a new room</p>
        </div>

        <div className="rounded-2xl border border-border bg-surface/80 p-6 backdrop-blur-sm shadow-xl">
          <RoomForm />
        </div>

        <div className="mt-4 text-center">
          <Link
            href="/"
            className="text-sm text-foreground-muted hover:text-foreground transition-colors"
          >
            ← Back to home
          </Link>
        </div>
      </div>
    </main>
  );
}
