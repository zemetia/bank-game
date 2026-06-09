'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from '@/i18n/navigation';
import { useToast } from '@/hooks';
import { useUserStore } from '@/stores';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { CreateRoomModal } from '../CreateRoomModal';
import { AuthModal } from '../AuthModal';
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
  const [authOpen, setAuthOpen] = useState(false);
  const router = useRouter();
  const toast = useToast();
  const { userId, name, clearUser } = useUserStore();

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
        <div className="mb-10 flex w-full max-w-sm items-center justify-between">
          <div className="text-center w-full">
            <h1 className="mb-2 text-4xl font-bold tracking-tight text-[--color-foreground]">
              {headline}
            </h1>
            <p className="text-sm text-[--color-foreground-muted]">{sub}</p>
          </div>
        </div>

        {/* Account status */}
        <div className="mb-6 flex w-full max-w-sm items-center justify-between rounded-lg border border-[--color-border] bg-[--color-surface] px-4 py-2.5">
          {isLoggedIn ? (
            <>
              <span className="text-sm text-[--color-foreground]">
                <span className="text-[--color-foreground-muted]">Signed in as </span>
                <span className="font-medium">{name}</span>
              </span>
              <button
                onClick={clearUser}
                className="text-xs text-[--color-foreground-subtle] hover:text-[--color-foreground] transition-colors"
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              <span className="text-sm text-[--color-foreground-muted]">No account</span>
              <button
                onClick={() => setAuthOpen(true)}
                className="text-xs font-medium text-[--color-primary] hover:text-[--color-primary-hover] transition-colors"
              >
                Sign in / Register
              </button>
            </>
          )}
        </div>

        {/* Join form */}
        <form onSubmit={handleJoin} className="flex w-full max-w-sm flex-col gap-3">
          <Input
            placeholder="ABCDEF"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            required
            maxLength={6}
            className="h-16 text-center text-2xl font-mono tracking-[0.3em] uppercase"
            size="lg"
            aria-label="Room Code"
            autoComplete="off"
            spellCheck={false}
          />
          <Button type="submit" size="xl" fullWidth isLoading={loading} disabled={code.length < 6}>
            Enter Room
          </Button>
        </form>

        <div className="my-6 flex w-full max-w-sm items-center gap-3">
          <div className="h-px flex-1 bg-[--color-border]" />
          <span className="text-xs uppercase tracking-widest text-[--color-foreground-subtle]">
            or
          </span>
          <div className="h-px flex-1 bg-[--color-border]" />
        </div>

        <div className="w-full max-w-sm">
          <CreateRoomModal label={createLabel} title={createTitle} />
        </div>

        {/* Your Rooms */}
        {isLoggedIn && (
          <div className="mt-8 w-full max-w-sm">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest text-[--color-foreground-subtle]">
              Your Rooms
            </h2>
            {roomsLoading ? (
              <div className="flex flex-col gap-2">
                {[1, 2].map((i) => (
                  <div
                    key={i}
                    className="h-14 animate-pulse rounded-lg bg-[--color-surface]"
                  />
                ))}
              </div>
            ) : myRooms && myRooms.length > 0 ? (
              <ul className="flex flex-col gap-2">
                {myRooms.map((room) => (
                  <li key={room.id}>
                    <button
                      onClick={() => router.push(`/room/${room.code}`)}
                      className="flex w-full items-center justify-between rounded-lg border border-[--color-border] bg-[--color-surface] px-4 py-3 transition-colors hover:border-[--color-primary] hover:bg-[--color-surface-raised] text-left"
                    >
                      <span className="font-medium text-[--color-foreground]">{room.name}</span>
                      <span className="font-mono text-sm tracking-widest text-[--color-foreground-muted]">
                        {room.code}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-[--color-foreground-subtle]">
                No rooms yet. Create one above.
              </p>
            )}
          </div>
        )}
      </div>

      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </>
  );
}
