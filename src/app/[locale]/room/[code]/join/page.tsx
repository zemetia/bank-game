import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import { redirect } from '@/i18n/navigation';
import { roomService } from '@/services';
import { verifyJwt } from '@/lib/jwt';
import { PinEntry } from '@/components/game/PinEntry';
import { Landmark, KeyRound } from 'lucide-react';

interface Props {
  params: Promise<{ locale: string; code: string }>;
}

export const metadata: Metadata = {
  title: 'Enter PIN',
};

export default async function JoinPage({ params }: Props) {
  const { code } = await params;

  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;
  const jwt = token ? verifyJwt(token) : null;
  if (!jwt) redirect('/login');

  const room = await roomService.getByCode(code);
  if (!room) notFound();

  const player = room.users.find((u) => u.userId === jwt.userId);
  if (!player) notFound();

  if (player.isMaster) redirect(`/room/${code}/master`);

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm">

        {/* Brand */}
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary glow-primary">
            <Landmark className="h-7 w-7 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">BankGame</h1>
            <p className="mt-1 text-sm text-foreground-muted">{room.name}</p>
          </div>
        </div>

        {/* PIN card */}
        <div className="overflow-hidden rounded-2xl border border-border bg-surface/80 backdrop-blur-sm shadow-xl">
          <div className="flex items-center gap-2.5 border-b border-border px-6 py-4">
            <KeyRound className="h-4 w-4 text-foreground-muted" />
            <div>
              <h2 className="text-sm font-semibold text-foreground">Enter PIN</h2>
              <p className="text-xs text-foreground-muted">Welcome, {player.name}</p>
            </div>
          </div>
          <div className="px-6 py-8">
            <PinEntry roomCode={code} userId={jwt.userId} roomUserId={player.id} />
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-foreground-subtle">
          Use the PIN you set when you joined.
        </p>
      </div>
    </main>
  );
}
