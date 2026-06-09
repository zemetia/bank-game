'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/stores';
import { useToast } from '@/hooks';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { AddPlayerButton } from '../LobbyActions';
import { TransactionHistory } from '../TransactionHistory';
import type { RoomWithUsersVO, TransactionVO } from '@/types/value-objects';

MasterDashboard.displayName = 'MasterDashboard';

interface Props {
  roomCode: string;
  masterId: string;
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
    <div className="flex flex-col gap-8">
      <section>
        <h2 className="mb-4 font-semibold text-[--color-foreground]">Players</h2>
        {room && (
          <ul className="flex flex-col gap-3">
            {room.users.map((user) => (
              <PlayerRow
                key={user.id}
                user={user}
                removing={removingId === user.id}
                onRemove={() => handleRemove(user.id)}
                onBalance={handleBalance}
              />
            ))}
          </ul>
        )}
      </section>

      <AddPlayerButton roomCode={roomCode} masterId={masterId} onSuccess={refresh} />

      <section>
        <h2 className="mb-3 font-semibold text-[--color-foreground]">All Transactions</h2>
        <TransactionHistory transactions={transactions} />
      </section>

      <Button variant="outline" onClick={handleLeave}>Leave Room</Button>
    </div>
  );
}

interface PlayerRowProps {
  user: RoomWithUsersVO['users'][number];
  removing: boolean;
  onRemove: () => void;
  onBalance: (userId: string, type: 'deposit' | 'withdraw', amount: number, note?: string) => Promise<void>;
}

function PlayerRow({ user, removing, onRemove, onBalance }: PlayerRowProps) {
  const toast = useToast();

  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState<'deposit' | 'withdraw' | null>(null);

  async function doBalance(type: 'deposit' | 'withdraw') {
    const n = Math.round(parseFloat(amount));
    if (!n || n <= 0) { toast.error('Invalid amount'); return; }
    setLoading(type);
    try {
      await onBalance(user.id, type, n, note || undefined);
      setAmount('');
      setNote('');
      toast.success(`${type} applied`);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoading(null);
    }
  }

  return (
    <li className="rounded-lg border border-[--color-border] bg-[--color-surface] px-4 py-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-medium text-[--color-foreground]">{user.name}</span>
          {user.isMaster && <Badge variant="default">Master</Badge>}
          <span className="font-mono text-sm text-[--color-foreground-muted]">
            {user.balance.toLocaleString()}
          </span>
        </div>
        {!user.isMaster && (
          <Button size="sm" variant="destructive" disabled={removing} onClick={onRemove}>
            {removing ? 'Removing…' : 'Remove'}
          </Button>
        )}
      </div>
      <div className="flex gap-2">
        <Input
          placeholder="Deposit / Withdraw"
          type="number"
          min={1}
          step={1}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="flex-1"
        />
        <Input
          placeholder="Note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="flex-1"
        />
        <Button size="sm" disabled={!!loading} onClick={() => doBalance('deposit')}>
          {loading === 'deposit' ? 'Depositing…' : 'Deposit'}
        </Button>
        <Button size="sm" variant="outline" disabled={!!loading} onClick={() => doBalance('withdraw')}>
          {loading === 'withdraw' ? 'Withdrawing…' : 'Withdraw'}
        </Button>
      </div>
    </li>
  );
}

PlayerRow.displayName = 'PlayerRow';
