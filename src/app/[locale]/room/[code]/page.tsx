import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import { roomService } from '@/services';
import { verifyJwt } from '@/lib/jwt';
import { Typography } from '@/components/ui/Typography';
import { Badge } from '@/components/ui/Badge';
import { LobbyActions } from '@/components/game/LobbyActions';

interface Props {
  params: Promise<{ locale: string; code: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { code } = await params;
  const room = await roomService.getByCode(code);
  if (!room) return { title: 'Room not found' };
  return { title: `Room — ${room.name}` };
}

export default async function LobbyPage({ params }: Props) {
  const { code } = await params;
  const room = await roomService.getByCode(code);
  if (!room) notFound();

  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;
  const jwt = token ? verifyJwt(token) : null;

  const currentRoomUser = jwt
    ? (room.users.find((u) => u.userId === jwt.userId) ?? null)
    : null;

  return (
    <main className="min-h-screen bg-[--color-background]">
      <div className="mx-auto max-w-lg px-4 py-12">
        <div className="mb-8">
          <Typography variant="h2" className="mb-1">{room.name}</Typography>
          <div className="flex items-center gap-2">
            <span className="text-sm text-[--color-foreground-muted]">Room code:</span>
            <Badge variant="outline" className="font-mono tracking-widest">{room.code}</Badge>
          </div>
        </div>

        <div className="mb-6">
          <h3 className="mb-4 font-semibold text-[--color-foreground]">Players</h3>
          <ul className="flex flex-col gap-2">
            {room.users.map((user) => (
              <li
                key={user.id}
                className="flex items-center justify-between rounded-lg border border-[--color-border] bg-[--color-surface] px-4 py-3"
              >
                <div className="flex items-center gap-2">
                  <span className="font-medium text-[--color-foreground]">{user.name}</span>
                  {user.isMaster && <Badge variant="default">Master</Badge>}
                  {user.id === currentRoomUser?.id && (
                    <Badge variant="outline">You</Badge>
                  )}
                </div>
                <span className="font-mono text-sm text-[--color-foreground-muted]">
                  {user.balance.toLocaleString()}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <LobbyActions
          roomCode={room.code}
          currentRoomUser={currentRoomUser}
        />
      </div>
    </main>
  );
}
