'use client';

import { useState } from 'react';
import { useToast } from '@/hooks';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

AddUserForm.displayName = 'AddUserForm';

interface Props {
  roomCode: string;
  requesterId: string;
  onSuccess?: () => void;
}

export function AddUserForm({ roomCode, requesterId, onSuccess }: Props) {
  const toast = useToast();

  const [name, setName] = useState('');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`/api/rooms/${roomCode}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, pin, requesterId }),
      });
      const data = await res.json() as { error?: string };
      if (!res.ok) throw new Error(data.error ?? 'Failed');
      toast.success(`${name} added`);
      setName('');
      setPin('');
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
        label="Player Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
        maxLength={50}
      />
      <Input
        label="Player PIN"
        type="password"
        inputMode="numeric"
        value={pin}
        onChange={(e) => setPin(e.target.value)}
        required
        minLength={6}
        maxLength={6}
        pattern="\d{6}"
      />
      <Button type="submit" disabled={loading}>
        {loading ? 'Adding…' : 'Add Player'}
      </Button>
    </form>
  );
}
