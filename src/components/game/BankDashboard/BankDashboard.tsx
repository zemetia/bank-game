'use client';

import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/stores';
import { Button } from '@/components/ui/Button';
import { TransactionForm } from '../TransactionForm';
import { TransactionHistory } from '../TransactionHistory';
import type { RoomWithUsersVO, TransactionVO } from '@/types/value-objects';

BankDashboard.displayName = 'BankDashboard';

interface Props {
  roomCode: string;
  userId: string;
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

export function BankDashboard({ roomCode, userId }: Props) {
  const router = useRouter();
  const { clearSession } = useGameStore();

  const roomQuery = useQuery({ queryKey: ['room', roomCode], queryFn: () => fetchRoom(roomCode) });
  const txQuery = useQuery({ queryKey: ['transactions', roomCode], queryFn: () => fetchTransactions(roomCode) });

  const room = roomQuery.data;
  const user = room?.users.find((u) => u.id === userId);
  const myTx = (txQuery.data ?? []).filter((tx) => tx.fromUserId === userId || tx.toUserId === userId);

  function refresh() {
    void roomQuery.refetch();
    void txQuery.refetch();
  }

  function handleLeave() {
    clearSession();
    router.push('/');
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-xl border border-[--color-border] bg-[--color-surface-raised] px-6 py-5">
        <p className="text-sm text-[--color-foreground-muted]">Balance</p>
        <p className="mt-1 font-mono text-4xl font-bold tabular-nums text-[--color-foreground]">
          {user?.balance.toLocaleString() ?? '—'}
        </p>
        <p className="mt-1 text-sm text-[--color-foreground-muted]">{user?.name}</p>
      </div>

      {room && user && (
        <div className="rounded-xl border border-[--color-border] bg-[--color-surface] px-6 py-5">
          <h2 className="mb-4 font-semibold text-[--color-foreground]">Transfer</h2>
          <TransactionForm
            roomCode={roomCode}
            currentUserId={userId}
            users={room.users}
            onSuccess={refresh}
          />
        </div>
      )}

      <div>
        <h2 className="mb-3 font-semibold text-[--color-foreground]">Transaction History</h2>
        <TransactionHistory transactions={myTx} currentUserId={userId} />
      </div>

      <Button variant="outline" onClick={handleLeave}>Leave Room</Button>
    </div>
  );
}
