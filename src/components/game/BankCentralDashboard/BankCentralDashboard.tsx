'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from '@/i18n/navigation';
import { useToast } from '@/hooks';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Separator } from '@/components/ui/Separator';
import { TransactionHistory } from '../TransactionHistory';
import { PinOverlay } from '../PinOverlay';
import {
  ArrowLeftRight,
  Building2,
  ChevronLeft,
  RefreshCw,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import type { RoomWithUsersVO, TransactionVO } from '@/types/value-objects';

BankCentralDashboard.displayName = 'BankCentralDashboard';

interface Props {
  roomCode: string;
  masterId: string;
  masterUserId: string;
  initialBankBalance: number;
  initialBankCentralEnabled: boolean;
}

async function fetchRoom(code: string): Promise<RoomWithUsersVO> {
  const res = await fetch(`/api/rooms/${code}`);
  if (!res.ok) throw new Error('Room not found');
  const data = await res.json() as { room: RoomWithUsersVO };
  return data.room;
}

async function fetchTransactions(code: string): Promise<TransactionVO[]> {
  const res = await fetch(`/api/rooms/${code}/transactions`);
  if (!res.ok) throw new Error('Failed to load transactions');
  const data = await res.json() as { transactions: TransactionVO[] };
  return data.transactions;
}

const BANK_TYPES = new Set(['bank_deposit', 'bank_withdraw', 'bank_to_user', 'user_to_bank']);

export function BankCentralDashboard({ roomCode, masterId, masterUserId, initialBankBalance, initialBankCentralEnabled }: Props) {
  const router = useRouter();
  const toast = useToast();

  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [targetUserId, setTargetUserId] = useState('');
  const [pending, setPending] = useState<{
    type: 'bank_deposit' | 'bank_withdraw' | 'bank_to_user' | 'user_to_bank';
    amount: number;
    note?: string;
    targetUserId?: string;
  } | null>(null);

  const roomQuery = useQuery({ queryKey: ['room', roomCode], queryFn: () => fetchRoom(roomCode) });
  const txQuery = useQuery({ queryKey: ['transactions', roomCode], queryFn: () => fetchTransactions(roomCode) });

  const room = roomQuery.data;
  const bankBalance = room?.bankCentralBalance ?? initialBankBalance;
  const bankEnabled = room?.bankCentralEnabled ?? initialBankCentralEnabled;
  const nonMasterUsers = room?.users ?? [];
  const bankTx = (txQuery.data ?? []).filter((tx) => BANK_TYPES.has(tx.type));

  const isLoading = roomQuery.isLoading || txQuery.isLoading;

  function refresh() {
    void roomQuery.refetch();
    void txQuery.refetch();
  }

  function request(type: 'bank_deposit' | 'bank_withdraw' | 'bank_to_user' | 'user_to_bank') {
    const n = Math.round(parseFloat(amount));
    if (!n || n <= 0) { toast.error('Invalid amount'); return; }
    if ((type === 'bank_to_user' || type === 'user_to_bank') && !targetUserId) {
      toast.error('Select a player'); return;
    }
    setPending({ type, amount: n, note: note || undefined, targetUserId: targetUserId || undefined });
  }

  async function handlePinConfirm(pin: string) {
    if (!pending) return;

    const authRes = await fetch(`/api/rooms/${roomCode}/auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: masterUserId, pin }),
    });
    const authData = await authRes.json() as { error?: string };
    if (!authRes.ok) throw new Error(authData.error ?? 'Invalid PIN');

    const body: Record<string, unknown> = {
      type: pending.type,
      amount: pending.amount,
      note: pending.note,
      requesterId: masterId,
    };
    if (pending.type === 'bank_to_user') body.toUserId = pending.targetUserId;
    if (pending.type === 'user_to_bank') body.fromUserId = pending.targetUserId;

    const txRes = await fetch(`/api/rooms/${roomCode}/transactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const txData = await txRes.json() as { error?: string };
    if (!txRes.ok) throw new Error(txData.error ?? 'Failed');

    toast.success('Done');
    setPending(null);
    setAmount('');
    setNote('');
    setTargetUserId('');
    refresh();
  }

  return (
    <div className="flex flex-col gap-5">
      {pending && (
        <PinOverlay
          title="Confirm Bank Operation"
          subtitle={`${pending.type.replace(/_/g, ' ')} · ${pending.amount.toLocaleString()}`}
          onConfirm={handlePinConfirm}
          onCancel={() => setPending(null)}
        />
      )}

      {/* Header */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => router.push(`/room/${roomCode}/master`)}
          aria-label="Back to master"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary glow-primary">
          <Building2 className="h-5 w-5 text-primary-foreground" />
        </div>
        <div>
          <p className="text-sm font-bold tracking-tight text-foreground">Bank Central</p>
          <p className="text-xs text-foreground-subtle">Room {roomCode}</p>
        </div>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={refresh}
          disabled={isLoading}
          aria-label="Refresh"
          className="ml-auto"
        >
          <RefreshCw className={cn('h-4 w-4', isLoading && 'animate-spin')} />
        </Button>
      </div>

      {/* Balance card */}
      <div className="relative overflow-hidden rounded-2xl border border-border bg-surface/80 px-6 py-7 backdrop-blur-sm">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-primary opacity-10 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-10 -left-10 h-32 w-32 rounded-full bg-primary opacity-5 blur-3xl"
        />
        <p className="text-xs font-medium uppercase tracking-widest text-foreground-muted">
          Bank Balance
        </p>
        <p className="mt-2 font-mono text-5xl font-bold tabular-nums text-foreground">
          {isLoading ? (
            <span className="inline-block h-12 w-40 animate-pulse rounded-md bg-surface-overlay" />
          ) : (
            bankBalance.toLocaleString()
          )}
        </p>
      </div>

      {/* Management controls */}
      {bankEnabled && (
        <section className="overflow-hidden rounded-xl border border-border bg-surface/80 backdrop-blur-sm">
          <div className="flex items-center gap-2.5 border-b border-border px-4 py-3">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary-subtle">
              <ArrowLeftRight className="h-3.5 w-3.5 text-primary" />
            </div>
            <span className="font-semibold text-foreground">Operations</span>
          </div>

          <div className="flex flex-col gap-3 p-4">
            <div className="flex gap-2">
              <Input
                placeholder="Amount"
                type="number"
                min={1}
                step={1}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="flex-1"
              />
              <Input
                placeholder="Note (optional)"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="flex-1"
              />
            </div>

            <div className="flex gap-2">
              <Button size="sm" className="flex-1" disabled={!amount} onClick={() => request('bank_deposit')}>
                <TrendingUp className="h-3.5 w-3.5" />
                Deposit
              </Button>
              <Button size="sm" variant="outline" className="flex-1" disabled={!amount} onClick={() => request('bank_withdraw')}>
                <TrendingDown className="h-3.5 w-3.5" />
                Withdraw
              </Button>
            </div>

            {nonMasterUsers.length > 0 && (
              <>
                <select
                  value={targetUserId}
                  onChange={(e) => setTargetUserId(e.target.value)}
                  className="h-9 w-full rounded-lg border border-input bg-surface-raised px-3 text-sm text-foreground"
                >
                  <option value="">Select player…</option>
                  {nonMasterUsers.map((u: RoomWithUsersVO['users'][number]) => (
                    <option key={u.id} value={u.id}>{u.name} ({u.balance.toLocaleString()})</option>
                  ))}
                </select>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="flex-1" disabled={!amount || !targetUserId} onClick={() => request('bank_to_user')}>
                    Bank → Player
                  </Button>
                  <Button size="sm" variant="outline" className="flex-1" disabled={!amount || !targetUserId} onClick={() => request('user_to_bank')}>
                    Player → Bank
                  </Button>
                </div>
              </>
            )}
          </div>
        </section>
      )}

      <Separator />

      {/* Bank transaction history */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-foreground-subtle">Bank Transactions</h2>
          {bankTx.length > 0 && (
            <span className="rounded-full bg-surface-raised px-2.5 py-0.5 text-xs font-medium text-foreground-muted">
              {bankTx.length}
            </span>
          )}
        </div>
        <TransactionHistory transactions={bankTx} />
      </section>
    </div>
  );
}
