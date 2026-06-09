'use client';

import { useState } from 'react';
import { useToast } from '@/hooks';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import type { RoomUserVO } from '@/types/value-objects';

TransactionForm.displayName = 'TransactionForm';

interface Props {
  roomCode: string;
  currentUserId: string;
  users: RoomUserVO[];
  onSuccess?: () => void;
}

export function TransactionForm({ roomCode, currentUserId, users, onSuccess }: Props) {
  const toast = useToast();

  const [toUserId, setToUserId] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);

  const others = users.filter((u) => u.id !== currentUserId);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`/api/rooms/${roomCode}/transactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'transfer',
          fromUserId: currentUserId,
          toUserId,
          amount: Math.round(parseFloat(amount)),
          note: note || undefined,
          requesterId: currentUserId,
        }),
      });
      const data = await res.json() as { error?: string };
      if (!res.ok) throw new Error(data.error ?? 'Transfer failed');
      toast.success('Transfer sent');
      setToUserId('');
      setAmount('');
      setNote('');
      onSuccess?.();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-[--color-foreground]">To</label>
        <select
          value={toUserId}
          onChange={(e) => setToUserId(e.target.value)}
          required
          className="rounded-md border border-[--color-input] bg-[--color-surface] px-3 py-2 text-sm text-[--color-foreground] focus:outline-none focus:ring-2 focus:ring-[--color-ring]"
        >
          <option value="">—</option>
          {others.map((u) => (
            <option key={u.id} value={u.id}>{u.name}</option>
          ))}
        </select>
      </div>
      <Input
        label="Amount"
        type="number"
        min={1}
        step={1}
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        required
      />
      <Input
        label="Note (optional)"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        maxLength={200}
      />
      <Button type="submit" disabled={loading || !toUserId}>
        {loading ? 'Sending…' : 'Send'}
      </Button>
    </form>
  );
}
