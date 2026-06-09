'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from '@/i18n/navigation';
import { useGameStore } from '@/stores';
import { useToast } from '@/hooks';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Separator } from '@/components/ui/Separator';
import { AddPlayerButton } from '../LobbyActions';
import { TransactionHistory } from '../TransactionHistory';
import { PinOverlay } from '../PinOverlay';
import { useUserStore } from '@/stores';
import { Users, Coins, ArrowLeftRight, LogOut } from 'lucide-react';
import type { RoomWithUsersVO, TransactionVO } from '@/types/value-objects';

MasterDashboard.displayName = 'MasterDashboard';

interface Props {
  roomCode: string;
  masterId: string;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return name.slice(0, 2).toUpperCase();
  const first = parts[0]?.[0] ?? '';
  const last = parts[parts.length - 1]?.[0] ?? '';
  return `${first}${last}`.toUpperCase();
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

export function MasterDashboard({ roomCode, masterId }: Props) {
  const router = useRouter();
  const { clearSession } = useGameStore();
  const toast = useToast();

  const [removingId, setRemovingId] = useState<string | null>(null);

  const roomQuery = useQuery({ queryKey: ['room', roomCode], queryFn: () => fetchRoom(roomCode) });
  const txQuery = useQuery({ queryKey: ['transactions', roomCode], queryFn: () => fetchTransactions(roomCode) });

  const room = roomQuery.data;
  const transactions = txQuery.data ?? [];

  const totalBalance = room?.users.reduce((acc, u) => acc + u.balance, 0) ?? 0;

  function refresh() {
    void roomQuery.refetch();
    void txQuery.refetch();
  }

  async function handleRemove(userId: string) {
    setRemovingId(userId);
    try {
      const res = await fetch(`/api/rooms/${roomCode}/users/${userId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requesterId: masterId }),
      });
      if (!res.ok) {
        const d = await res.json() as { error?: string };
        throw new Error(d.error ?? 'Failed');
      }
      refresh();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setRemovingId(null);
    }
  }

  async function handleBalance(userId: string, type: 'deposit' | 'withdraw', amount: number, note?: string) {
    const res = await fetch(`/api/rooms/${roomCode}/transactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type,
        ...(type === 'deposit' ? { toUserId: userId } : { fromUserId: userId }),
        amount,
        note,
        requesterId: masterId,
      }),
    });
    if (!res.ok) {
      const d = await res.json() as { error?: string };
      throw new Error(d.error ?? 'Failed');
    }
    refresh();
  }

  function handleLeave() {
    clearSession();
    router.push('/');
  }

  return (
    <div className="flex flex-col gap-6">

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-border bg-surface/80 p-4 backdrop-blur-sm">
          <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-primary-subtle">
            <Users className="h-4 w-4 text-primary" />
          </div>
          <p className="font-mono text-xl font-bold tabular-nums text-foreground">
            {room?.users.length ?? '—'}
          </p>
          <p className="mt-0.5 text-xs text-foreground-muted">Players</p>
        </div>
        <div className="rounded-xl border border-border bg-surface/80 p-4 backdrop-blur-sm">
          <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-success-subtle">
            <Coins className="h-4 w-4 text-success" />
          </div>
          <p className="font-mono text-xl font-bold tabular-nums text-foreground">
            {room ? totalBalance.toLocaleString() : '—'}
          </p>
          <p className="mt-0.5 text-xs text-foreground-muted">Total</p>
        </div>
        <div className="rounded-xl border border-border bg-surface/80 p-4 backdrop-blur-sm">
          <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-surface-overlay">
            <ArrowLeftRight className="h-4 w-4 text-foreground-muted" />
          </div>
          <p className="font-mono text-xl font-bold tabular-nums text-foreground">
            {transactions.length}
          </p>
          <p className="mt-0.5 text-xs text-foreground-muted">Transactions</p>
        </div>
      </div>

      {/* Players section */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-foreground-subtle">Players</h2>
        </div>
        {room && (
          <ul className="flex flex-col gap-3">
            {room.users.map((user) => (
              <PlayerRow
                key={user.id}
                user={user}
                roomCode={roomCode}
                removing={removingId === user.id}
                onRemove={() => handleRemove(user.id)}
                onBalance={handleBalance}
              />
            ))}
          </ul>
        )}
        {!room && (
          <div className="flex flex-col gap-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 animate-pulse rounded-xl bg-surface" />
            ))}
          </div>
        )}
      </section>

      <AddPlayerButton roomCode={roomCode} masterId={masterId} onSuccess={refresh} />

      <Separator />

      {/* Transactions section */}
      <section>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-foreground-subtle">
          All Transactions
        </h2>
        <TransactionHistory transactions={transactions} />
      </section>

      <Separator />

      <Button variant="outline" onClick={handleLeave} className="w-full">
        <LogOut className="h-4 w-4" />
        Leave Room
      </Button>
    </div>
  );
}

interface PlayerRowProps {
  user: RoomWithUsersVO['users'][number];
  roomCode: string;
  removing: boolean;
  onRemove: () => void;
  onBalance: (userId: string, type: 'deposit' | 'withdraw', amount: number, note?: string) => Promise<void>;
}

function PlayerRow({ user, roomCode, removing, onRemove, onBalance }: PlayerRowProps) {
  const toast = useToast();
  const { userId: masterAccountId } = useUserStore();

  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [pending, setPending] = useState<{ type: 'deposit' | 'withdraw'; amount: number; note?: string } | null>(null);

  function requestBalance(type: 'deposit' | 'withdraw') {
    const n = Math.round(parseFloat(amount));
    if (!n || n <= 0) { toast.error('Invalid amount'); return; }
    setPending({ type, amount: n, note: note || undefined });
  }

  async function handlePinConfirm(pin: string) {
    if (!pending) return;

    const authRes = await fetch(`/api/rooms/${roomCode}/auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: masterAccountId, pin }),
    });
    const authData = await authRes.json() as { error?: string };
    if (!authRes.ok) throw new Error(authData.error ?? 'Invalid PIN');

    await onBalance(user.id, pending.type, pending.amount, pending.note);

    toast.success(`${pending.type} applied`);
    setPending(null);
    setAmount('');
    setNote('');
  }

  return (
    <>
      {pending && (
        <PinOverlay
          title={`Confirm ${pending.type.charAt(0).toUpperCase() + pending.type.slice(1)}`}
          subtitle={`${user.name} · ${pending.amount.toLocaleString()}`}
          onConfirm={handlePinConfirm}
          onCancel={() => setPending(null)}
        />
      )}

      <li className="overflow-hidden rounded-xl border border-border bg-surface/80 backdrop-blur-sm">
        {/* Player info row */}
        <div className="flex items-center gap-3 px-4 py-3.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-subtle text-sm font-semibold text-primary">
            {getInitials(user.name)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="truncate font-medium text-foreground">{user.name}</span>
              {user.isMaster && <Badge variant="default" size="sm">Master</Badge>}
            </div>
            <p className="font-mono text-sm tabular-nums text-foreground-muted">
              {user.balance.toLocaleString()}
            </p>
          </div>
          {!user.isMaster && (
            <Button
              size="sm"
              variant="destructive"
              disabled={removing}
              onClick={onRemove}
            >
              {removing ? 'Removing…' : 'Remove'}
            </Button>
          )}
        </div>

        {/* Balance controls */}
        <div className="border-t border-border bg-surface-raised px-4 py-3">
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
            <Button size="sm" disabled={!amount} onClick={() => requestBalance('deposit')}>
              Deposit
            </Button>
            <Button size="sm" variant="outline" disabled={!amount} onClick={() => requestBalance('withdraw')}>
              Withdraw
            </Button>
          </div>
        </div>
      </li>
    </>
  );
}

PlayerRow.displayName = 'PlayerRow';
