import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import { roomService } from '@/services';
import { verifyJwt } from '@/lib/jwt';
import { Badge } from '@/components/ui/Badge';
import { LobbyActions } from '@/components/game/LobbyActions';
import { Hash, Users } from 'lucide-react';

interface Props {
  params: Promise<{ locale: string; code: string }>;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return name.slice(0, 2).toUpperCase();
  const first = parts[0]?.[0] ?? '';
  const last = parts[parts.length - 1]?.[0] ?? '';
  return `${first}${last}`.toUpperCase();
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { code } = await params;
  const room = await roomService.getByCode(code);
  if (!room) return { title: 'Room Not Found' };
  return { title: room.name };
}

export default async function LobbyPage({ params }: Props) {
  const { code } = await params;
  const room = await roomService.getByCode(code);
  if (!room) notFound();

  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;
  const jwt = token ? await verifyJwt(token) : null;

  const currentRoomUser = jwt
    ? (room.users.find((u) => u.userId === jwt.userId) ?? null)
    : null;

  return (
    <main className="min-h-screen">
      <div className="mx-auto max-w-lg px-4 py-12">

        {/* Room header card */}
        <div className="mb-6 overflow-hidden rounded-2xl border border-border bg-surface/80 backdrop-blur-sm">
          <div className="relative px-6 py-5">
            <div
              aria-hidden
              className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-primary opacity-10 blur-2xl"
            />
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-xl font-bold tracking-tight text-foreground">{room.name}</h1>
                <p className="mt-0.5 text-sm text-foreground-muted">Game Room</p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <div className="flex items-center gap-1.5 rounded-lg border border-border bg-surface-raised px-3 py-1.5">
                  <Hash className="h-3 w-3 text-foreground-subtle" />
                  <span className="font-mono text-sm font-bold tracking-widest text-foreground">
                    {room.code}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-xs text-foreground-subtle">
                  <Users className="h-3 w-3" />
                  <span>{room.users.length} player{room.users.length !== 1 ? 's' : ''}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Players list */}
        <div className="mb-6">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-foreground-subtle">
            Players
          </h2>
          <ul className="flex flex-col gap-2">
            {room.users.map((user) => (
              <li
                key={user.id}
                className="flex items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3 transition-colors hover:bg-surface-raised"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-subtle text-sm font-semibold text-primary">
                  {getInitials(user.name)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate font-medium text-foreground">{user.name}</span>
                    {user.isMaster && (
                      <Badge variant="default" size="sm" className="shrink-0">Master</Badge>
                    )}
                    {user.id === currentRoomUser?.id && (
                      <Badge variant="outline" size="sm" className="shrink-0">You</Badge>
                    )}
                  </div>
                </div>
                <span className="shrink-0 font-mono text-sm font-medium tabular-nums text-foreground-muted">
                  {user.balance.toLocaleString()}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <LobbyActions roomCode={room.code} currentRoomUser={currentRoomUser} />
      </div>
    </main>
  );
}
