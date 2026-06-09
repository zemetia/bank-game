'use client';

import { useState } from 'react';
import { useRouter } from '@/i18n/navigation';
import { useGameStore } from '@/stores';
import { useToast } from '@/hooks';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

RoomForm.displayName = 'RoomForm';

export function RoomForm() {
  const router = useRouter();
  const { setSession } = useGameStore();
  const toast = useToast();

  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      const data = await res.json() as { room: { code: string }; masterId: string; error?: string };
      if (!res.ok) throw new Error(data.error ?? 'Failed to create room');

      setSession({ roomCode: data.room.code, userId: data.masterId, isMaster: true });
      router.push(`/room/${data.room.code}/master`);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Input
        label="Room Name"
        placeholder="e.g. Friday Night Monopoly"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
        maxLength={80}
      />
      <Button type="submit" size="lg" fullWidth isLoading={loading}>
        Create Room
      </Button>
    </form>
  );
}
