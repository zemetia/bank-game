'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/stores';
import { useToast } from '@/hooks';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

PinEntry.displayName = 'PinEntry';

interface Props {
  roomCode: string;
  userId: string;
  roomUserId: string;
}

export function PinEntry({ roomCode, userId, roomUserId }: Props) {
  const router = useRouter();
  const { setSession } = useGameStore();
  const toast = useToast();

  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`/api/rooms/${roomCode}/auth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, pin }),
      });
      const data = await res.json() as { userId?: string; isMaster?: boolean; error?: string };
      if (!res.ok) throw new Error(data.error ?? 'Invalid PIN.');

      setSession({ roomCode, userId: roomUserId, isMaster: false });
      router.push(`/room/${roomCode}/bank`);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Input
        label="Your PIN"
        type="password"
        inputMode="numeric"
        value={pin}
        onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
        required
        minLength={6}
        maxLength={6}
        pattern="\d{6}"
        autoFocus
      />
      <Button type="submit" isLoading={loading} disabled={pin.length < 6}>
        Confirm
      </Button>
    </form>
  );
}
