'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from '@/i18n/navigation';
import { useToast } from '@/hooks';
import { useUserStore } from '@/stores';
import { useGameStore } from '@/stores';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { CreateRoomModal } from '../CreateRoomModal';
import { Landmark, ChevronRight, UserCircle2, LogOut } from 'lucide-react';
import type { RoomVO } from '@/types/value-objects';

interface Props {
  headline: string;
  sub: string;
  createLabel: string;
  createTitle: string;
}

HomeLanding.displayName = 'HomeLanding';

export function HomeLanding({ headline, sub, createLabel, createTitle }: Props) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const toast = useToast();
  const { userId, name, clearUser } = useUserStore();
  const { clearSession } = useGameStore();

  const isLoggedIn = !!userId;

  const { data: myRooms, isLoading: roomsLoading } = useQuery<RoomVO[]>({
    queryKey: ['my-rooms', userId],
    queryFn: async () => {
      const res = await fetch('/api/users/rooms');
      if (!res.ok) return [];
      const data = await res.json() as { rooms: RoomVO[] };
      return data.rooms;
    },
    enabled: isLoggedIn,
  });

  async function handleSignOut() {
    await fetch('/api/auth/logout', { method: 'POST' });
    clearUser();
    clearSession();
    window.location.replace('/login');
  }

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`/api/rooms/${code.toUpperCase()}`, { cache: 'no-store' });
      if (!res.ok) throw new Error('Room not found');
      router.push(`/room/${code.toUpperCase()}`);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="flex min-h-screen flex-col items-center justify-center px-4 py-16">

        {/* Brand header */}
        <div className="mb-8 flex flex-col items-center gap-4 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary glow-primary">
            <Landmark className="h-8 w-8 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">BankGame</h1>
            <p className="mt-1.5 max-w-xs text-sm text-foreground-muted">{headline}</p>
          </div>
        </div>

        {/* Main action card */}
        <div className="w-full max-w-sm overflow-hidden rounded-2xl border border-border bg-surface/80 shadow-xl backdrop-blur-sm">
          <div className="p-6">
            <p className="mb-3 text-xs font-medium uppercase tracking-widest text-foreground-subtle">
              Enter Room Code
            </p>

            <form onSubmit={handleJoin} className="flex flex-col gap-3">
              <Input
                placeholder="ABCDEF"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                required
                maxLength={6}
                className="h-14 text-center text-2xl font-mono tracking-[0.4em] uppercase"
                size="lg"
                aria-label="Room Code"
                autoComplete="off"
                spellCheck={false}
              />
              <Button
                type="submit"
                size="xl"
                fullWidth
                isLoading={loading}
                disabled={code.length < 6}
              >
                Enter Room
              </Button>
            </form>

            <div className="my-5 flex items-center gap-3">
              <div className="h-px flex-1 bg-border" />
              <span className="text-xs uppercase tracking-widest text-foreground-subtle">or</span>
              <div className="h-px flex-1 bg-border" />
            </div>

            <CreateRoomModal label={createLabel} title={createTitle} />
          </div>

          {/* Account status bar */}
          <div className="flex items-center justify-between border-t border-border bg-surface-raised px-5 py-3">
            <div className="flex items-center gap-2">
              <UserCircle2 className="h-4 w-4 shrink-0 text-foreground-subtle" />
              <span className="text-sm text-foreground">
                <span className="text-foreground-muted">Signed in as </span>
                <span className="font-medium">{name}</span>
              </span>
            </div>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-1.5 text-xs text-foreground-subtle transition-colors hover:text-destructive"
            >
              <LogOut className="h-3 w-3" />
              Sign out
            </button>
          </div>
        </div>

        {/* Your Rooms */}
        {isLoggedIn && (
          <div className="mt-6 w-full max-w-sm">
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-foreground-subtle">
              Your Rooms
            </h2>
            {roomsLoading ? (
              <div className="flex flex-col gap-2">
                {[1, 2].map((i) => (
                  <div key={i} className="h-12 animate-pulse rounded-xl bg-surface" />
                ))}
              </div>
            ) : myRooms && myRooms.length > 0 ? (
              <ul className="flex flex-col gap-2">
                {myRooms.map((room) => (
                  <li key={room.id}>
                    <button
                      onClick={() => router.push(`/room/${room.code}`)}
                      className="flex w-full items-center justify-between rounded-xl border border-border bg-surface px-4 py-3 text-left transition-all hover:border-primary/50 hover:bg-surface-raised"
                    >
                      <span className="font-medium text-foreground">{room.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs tracking-widest text-foreground-muted">
                          {room.code}
                        </span>
                        <ChevronRight className="h-3.5 w-3.5 text-foreground-subtle" />
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="rounded-xl border border-border border-dashed bg-surface px-4 py-6 text-center text-sm text-foreground-subtle">
                No rooms yet. Create one above.
              </p>
            )}
          </div>
        )}

        <p className="mt-8 text-center text-xs text-foreground-subtle">{sub}</p>
      </div>

    </>
  );
}
