'use client';

import { useQuery } from '@tanstack/react-query';
import { useRouter } from '@/i18n/navigation';
import {
  ArrowLeftRight,
  Building2,
  ClockIcon,
  CreditCard,
  LogOut,
  RefreshCw,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { useGameStore } from '@/stores';
import { Button } from '@/components/ui/Button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { TransactionForm } from '../TransactionForm';
import { TransactionHistory } from '../TransactionHistory';
import { cn } from '@/lib/cn';
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

  const totalIn = myTx
    .filter((tx) => tx.toUserId === userId)
    .reduce((acc, tx) => acc + tx.amount, 0);

  const totalOut = myTx
    .filter((tx) => tx.fromUserId === userId)
    .reduce((acc, tx) => acc + tx.amount, 0);

  function refresh() {
    void roomQuery.refetch();
    void txQuery.refetch();
  }

  function handleLeave() {
    clearSession();
    router.push('/');
  }

  const isLoading = roomQuery.isLoading || txQuery.isLoading;

  return (
    <div className="flex flex-col gap-5">

      {/* App header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary glow-primary">
            <Building2 className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <p className="text-sm font-bold tracking-tight text-foreground">BankGame</p>
            <p className="text-xs text-foreground-subtle">Room {roomCode}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={refresh}
            disabled={isLoading}
            aria-label="Refresh"
          >
            <RefreshCw className={cn('h-4 w-4', isLoading && 'animate-spin')} />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={handleLeave}
            aria-label="Leave room"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="account">
        <TabsList>
          <TabsTrigger value="account">
            <CreditCard className="h-4 w-4 shrink-0" />
            Account
          </TabsTrigger>
          <TabsTrigger value="history">
            <ClockIcon className="h-4 w-4 shrink-0" />
            History
            {myTx.length > 0 && (
              <span className="ml-0.5 rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-semibold leading-none text-primary-foreground">
                {myTx.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Account tab */}
        <TabsContent value="account" className="flex flex-col gap-4">

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
              Available Balance
            </p>
            <p className="mt-2 font-mono text-5xl font-bold tabular-nums text-foreground">
              {user ? (
                user.balance.toLocaleString()
              ) : (
                <span className="inline-block h-12 w-40 animate-pulse rounded-md bg-surface-overlay" />
              )}
            </p>
            <p className="mt-3 text-sm font-medium text-foreground-muted">
              {user?.name ?? ' '}
            </p>

            <div className="mt-5 flex gap-6 border-t border-border/50 pt-5">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-success-subtle">
                  <TrendingUp className="h-3.5 w-3.5 text-success" />
                </div>
                <div>
                  <p className="text-xs text-foreground-subtle">Money In</p>
                  <p className="font-mono text-sm font-semibold tabular-nums text-success">
                    +{totalIn.toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-destructive-subtle">
                  <TrendingDown className="h-3.5 w-3.5 text-destructive" />
                </div>
                <div>
                  <p className="text-xs text-foreground-subtle">Money Out</p>
                  <p className="font-mono text-sm font-semibold tabular-nums text-destructive">
                    -{totalOut.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Transfer section */}
          {room && user && (
            <div className="overflow-hidden rounded-xl border border-border bg-surface/80 backdrop-blur-sm">
              <div className="flex items-center gap-2.5 border-b border-border px-5 py-4">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary-subtle">
                  <ArrowLeftRight className="h-3.5 w-3.5 text-primary" />
                </div>
                <h2 className="font-semibold text-foreground">Transfer</h2>
              </div>
              <div className="p-5">
                <TransactionForm
                  roomCode={roomCode}
                  currentUserId={userId}
                  users={room.users}
                  onSuccess={refresh}
                />
              </div>
            </div>
          )}
        </TabsContent>

        {/* History tab */}
        <TabsContent value="history">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-foreground">Transaction History</h2>
            {myTx.length > 0 && (
              <span className="rounded-full bg-surface-raised px-2.5 py-0.5 text-xs font-medium text-foreground-muted">
                {myTx.length}
              </span>
            )}
          </div>
          <TransactionHistory transactions={myTx} currentUserId={userId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
