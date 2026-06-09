'use client';

import { useState } from 'react';
import { SendHorizonal, User, Landmark } from 'lucide-react';
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
import type { RoomUserVO } from '@/types/value-objects';

TransactionForm.displayName = 'TransactionForm';

const BANK_CENTRAL_ID = '__bank_central';

interface Props {
  roomCode: string;
  currentUserId: string;
  userAccountId: string;
  users: RoomUserVO[];
  requirePin: boolean;
  bankCentralEnabled?: boolean;
  onSuccess?: () => void;
}

export function TransactionForm({ roomCode, currentUserId, userAccountId, users, requirePin, bankCentralEnabled, onSuccess }: Props) {
  const toast = useToast();

  const [toUserId, setToUserId] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [pinPending, setPinPending] = useState(false);

  const others = users.filter((u) => u.id !== currentUserId);
  const recipient = others.find((u) => u.id === toUserId);
  const isBankCentral = toUserId === BANK_CENTRAL_ID;

  async function executeTransfer() {
    const body: Record<string, unknown> = {
      amount: Math.round(parseFloat(amount)),
      note: note || undefined,
      requesterId: currentUserId,
    };
    if (isBankCentral) {
      body.type = 'user_to_bank';
      body.fromUserId = currentUserId;
    } else {
      body.type = 'transfer';
      body.fromUserId = currentUserId;
      body.toUserId = toUserId;
    }

    const txRes = await fetch(`/api/rooms/${roomCode}/transactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const txData = await txRes.json() as { error?: string };
    if (!txRes.ok) throw new Error(txData.error ?? 'Transfer failed');

    toast.success(isBankCentral ? 'Sent to Bank Central' : 'Transfer sent');
    setToUserId('');
    setAmount('');
    setNote('');
    onSuccess?.();
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!toUserId || !amount) return;
    if (requirePin) {
      setPinPending(true);
    } else {
      void executeTransfer();
    }
  }

  async function handlePinConfirm(pin: string) {
    const res = await fetch(`/api/rooms/${roomCode}/auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: userAccountId, pin }),
    });
    const data = await res.json() as { error?: string };
    if (!res.ok) throw new Error(data.error ?? 'Invalid PIN');

    await executeTransfer();
    setPinPending(false);
  }

  return (
    <>
      {pinPending && (
        <PinOverlay
          title="Confirm Transfer"
          subtitle={isBankCentral ? `To Bank Central · ${parseInt(amount, 10).toLocaleString()}` : recipient ? `To ${recipient.name} · ${parseInt(amount, 10).toLocaleString()}` : undefined}
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
              {bankCentralEnabled && (
                <SelectItem value={BANK_CENTRAL_ID}>
                  <div className="flex items-center gap-2">
                    <Landmark className="h-3.5 w-3.5 shrink-0" />
                    Bank Central
                  </div>
                </SelectItem>
              )}
              {others.length === 0 && !bankCentralEnabled ? (
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
          {requirePin ? 'Send Transfer' : 'Send Transfer (no PIN)'}
        </Button>
      </form>
    </>
  );
}
