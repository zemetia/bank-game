'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/stores';
import { useToast } from '@/hooks';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import type { RoomUserVO } from '@/types/value-objects';

LobbyActions.displayName = 'LobbyActions';

interface Props {
  roomCode: string;
  currentRoomUser: RoomUserVO | null;
}

export function LobbyActions({ roomCode, currentRoomUser }: Props) {
  const router = useRouter();
  const { setSession } = useGameStore();
  const sessionSet = useRef(false);

  useEffect(() => {
    if (currentRoomUser?.isMaster && !sessionSet.current) {
      sessionSet.current = true;
      setSession({ roomCode, userId: currentRoomUser.id, isMaster: true });
      router.push(`/room/${roomCode}/master`);
    }
  }, [currentRoomUser, roomCode, router, setSession]);

  if (currentRoomUser?.isMaster) {
    return (
      <p className="text-sm text-[--color-foreground-muted]">Redirecting to master dashboard…</p>
    );
  }

  if (currentRoomUser) {
    return (
      <Button
        size="lg"
        fullWidth
        onClick={() => router.push(`/room/${roomCode}/join`)}
      >
        Enter My PIN
      </Button>
    );
  }

  return (
    <p className="rounded-lg border border-[--color-border] bg-[--color-surface] px-4 py-3 text-sm text-[--color-foreground-muted]">
      You haven&apos;t been added to this room. Ask the master to add you.
    </p>
  );
}

export function AddPlayerButton({ roomCode, masterId, onSuccess }: { roomCode: string; masterId: string; onSuccess?: () => void }) {
  const [open, setOpen] = useState(false);
  const [username, setUsername] = useState('');
  const [initialBalance, setInitialBalance] = useState('');
  const [loading, setLoading] = useState(false);
  const toast = useToast();
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`/api/rooms/${roomCode}/invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          initialBalance: initialBalance ? Math.round(parseFloat(initialBalance)) : 0,
          requesterId: masterId,
        }),
      });
      const data = await res.json() as { error?: string };
      if (!res.ok) throw new Error(data.error ?? 'Failed');
      toast.success(`@${username} added`);
      setUsername('');
      setInitialBalance('');
      setOpen(false);
      onSuccess ? onSuccess() : router.refresh();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <Button variant="outline" onClick={() => setOpen((v) => !v)}>
        {open ? 'Cancel' : '+ Add Player'}
      </Button>
      {open && (
        <form onSubmit={handleSubmit} className="flex flex-col gap-3 rounded-lg border border-[--color-border] bg-[--color-surface] p-4">
          <Input
            label="Friend's username"
            placeholder="player_username"
            value={username}
            onChange={(e) => setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
            required
            minLength={3}
            maxLength={30}
            autoFocus
          />
          <Input
            label="Starting balance (optional)"
            type="number"
            min={0}
            step={1}
            placeholder="0"
            value={initialBalance}
            onChange={(e) => setInitialBalance(e.target.value)}
          />
          <Button type="submit" isLoading={loading} disabled={username.length < 3}>
            Add Player
          </Button>
        </form>
      )}
    </div>
  );
}

AddPlayerButton.displayName = 'AddPlayerButton';
