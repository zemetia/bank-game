import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import { redirect } from '@/i18n/navigation';
import { roomService } from '@/services';
import { verifyJwt } from '@/lib/jwt';
import { MasterDashboard } from '@/components/game/MasterDashboard';
import { Crown, Hash } from 'lucide-react';

interface Props {
  params: Promise<{ locale: string; code: string }>;
}

export const metadata: Metadata = { title: 'Room Master' };

export default async function MasterPage({ params }: Props) {
  const { locale, code } = await params;

  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;
  const jwt = token ? await verifyJwt(token) : null;
  if (!jwt) { redirect({ href: '/login', locale }); return null; }

  const room = await roomService.getByCode(code);
  if (!room) notFound();

  const roomUser = room.users.find((u) => u.userId === jwt.userId);
  if (!roomUser) { redirect({ href: '/', locale }); return null; }

  if (!roomUser.isMaster) { redirect({ href: `/room/${code}/bank`, locale }); return null; }

  return (
    <main className="min-h-screen">
      <div className="mx-auto max-w-2xl px-4 pb-16 pt-10">
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-warning-subtle">
            <Crown className="h-5 w-5 text-warning" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-foreground">Room Master</h1>
            <div className="mt-0.5 flex items-center gap-1.5 text-xs text-foreground-muted">
              <Hash className="h-3 w-3" />
              <span className="font-mono tracking-widest">{code}</span>
            </div>
          </div>
        </div>

        <MasterDashboard roomCode={code} masterId={roomUser.id} masterUserId={jwt.userId} />
      </div>
    </main>
  );
}
