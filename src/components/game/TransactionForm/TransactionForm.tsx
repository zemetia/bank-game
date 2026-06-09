'use client';

import { useState } from 'react';
import { SendHorizonal, User } from 'lucide-react';
import { useToast } from '@/hooks';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PinOverlay } from '../PinOverlay';
import { useUserStore } from '@/stores';
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
  const { userId: userAccountId } = useUserStore();

  const [toUserId, setToUserId] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [pinPending, setPinPending] = useState(false);

  const others = users.filter((u) => u.id !== currentUserId);
  const recipient = others.find((u) => u.id === toUserId);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!toUserId || !amount) return;
    setPinPending(true);
  }

  async function handlePinConfirm(pin: string) {
    const res = await fetch(`/api/rooms/${roomCode}/auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: userAccountId, pin }),
    });
    const data = await res.json() as { error?: string };
    if (!res.ok) throw new Error(data.error ?? 'Invalid PIN');

    const txRes = await fetch(`/api/rooms/${roomCode}/transactions`, {
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
    const txData = await txRes.json() as { error?: string };
    if (!txRes.ok) throw new Error(txData.error ?? 'Transfer failed');

    toast.success('Transfer sent');
    setPinPending(false);
    setToUserId('');
    setAmount('');
    setNote('');
    onSuccess?.();
  }

  return (
    <>
      {pinPending && (
        <PinOverlay
          title="Confirm Transfer"
          subtitle={recipient ? `To ${recipient.name} · ${parseInt(amount, 10).toLocaleString()}` : undefined}
          onConfirm={handlePinConfirm}
          onCancel={() => setPinPending(false)}
        />
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-foreground">Recipient</label>
          <Select value={toUserId} onValueChange={setToUserId} required>
            <SelectTrigger className="w-full bg-surface-raised border-input h-9 text-sm">
              <div className="flex items-center gap-2">
                <User className="h-3.5 w-3.5 text-foreground-muted shrink-0" />
                <SelectValue placeholder="Select recipient" />
              </div>
            </SelectTrigger>
            <SelectContent>
              {others.length === 0 ? (
                <SelectItem value="__none" disabled>No other players</SelectItem>
              ) : (
                others.map((u) => (
                  <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>

        <Input
          label="Amount"
          type="number"
          min={1}
          step={1}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
          placeholder="0"
          leftAddon={<span className="text-xs font-semibold">$</span>}
        />

        <Input
          label="Note (optional)"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          maxLength={200}
          placeholder="Add a note…"
        />

        <Button
          type="submit"
          disabled={!toUserId || !amount}
          fullWidth
          rightIcon={<SendHorizonal className="h-4 w-4" />}
        >
          Send Transfer
        </Button>
      </form>
    </>
  );
}
