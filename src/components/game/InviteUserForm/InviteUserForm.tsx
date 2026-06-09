'use client';

import { useState } from 'react';
import { useToast } from '@/hooks';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

InviteUserForm.displayName = 'InviteUserForm';

interface Props {
  roomCode: string;
  requesterId: string;
  onSuccess?: () => void;
}

export function InviteUserForm({ roomCode, requesterId, onSuccess }: Props) {
  const toast = useToast();
  const [username, setUsername] = useState('');
  const [initialBalance, setInitialBalance] = useState('');
  const [loading, setLoading] = useState(false);

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
          requesterId,
        }),
      });
      const data = await res.json() as { error?: string };
      if (!res.ok) throw new Error(data.error ?? 'Failed');
      toast.success(`@${username} invited`);
      setUsername('');
      setInitialBalance('');
      onSuccess?.();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <Input
        label="Username"
        placeholder="player_username"
        value={username}
        onChange={(e) => setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
        required
        minLength={3}
        maxLength={30}
      />
      <Input
        label="Starting Balance (optional)"
        type="number"
        min={0}
        step={1}
        placeholder="0"
        value={initialBalance}
        onChange={(e) => setInitialBalance(e.target.value)}
      />
      <Button type="submit" disabled={loading || username.length < 3}>
        {loading ? 'Inviting…' : 'Invite Player'}
      </Button>
    </form>
  );
}
