import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { notFound, redirect } from 'next/navigation';
import { roomService } from '@/services';
import { verifyJwt } from '@/lib/jwt';
import { PinEntry } from '@/components/game/PinEntry';
import { Typography } from '@/components/ui/Typography';

export const metadata: Metadata = { title: 'Enter PIN' };

interface Props {
  params: Promise<{ code: string }>;
}

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
    <main className="min-h-screen bg-[--color-background]">
      <div className="mx-auto max-w-sm px-4 py-16">
        <Typography variant="h2" className="mb-2 text-center">Enter PIN</Typography>
        <p className="mb-8 text-center text-sm text-[--color-foreground-muted]">
          Welcome, {player.name}
        </p>
        <div className="rounded-xl border border-[--color-border] bg-[--color-surface] px-6 py-6">
          <PinEntry roomCode={code} userId={jwt.userId} roomUserId={player.id} />
        </div>
      </div>
    </main>
  );
}
