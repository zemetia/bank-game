'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from '@/i18n/navigation';
import {
  ArrowLeftRight,
  Building2,
  ChevronLeft,
  ClockIcon,
  CreditCard,
  LogOut,
  RefreshCw,
  TrendingDown,
  TrendingUp,
  Settings,
  Landmark,
} from 'lucide-react';
import { useGameStore } from '@/stores';
import { Button } from '@/components/ui/Button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { TransactionForm } from '../TransactionForm';
import { TransactionHistory } from '../TransactionHistory';
import { UserSettingsModal } from '../UserSettingsModal';
import { cn } from '@/lib/cn';
import type { RoomWithUsersVO, TransactionVO } from '@/types/value-objects';

BankDashboard.displayName = 'BankDashboard';

interface Props {
  roomCode: string;
  userId: string;
  userAccountId: string;
  isMaster?: boolean;
  transferPinEnabled: boolean;
  bankCentralEnabled: boolean;
  bankCentralBalance: number;
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

export function BankDashboard({ roomCode, userId, userAccountId, isMaster, transferPinEnabled: initialPinEnabled, bankCentralEnabled: initialBankEnabled, bankCentralBalance: initialBankBalance }: Props) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { clearSession } = useGameStore();
  const [settingsOpen, setSettingsOpen] = useState(false);

  const roomQuery = useQuery({ queryKey: ['room', roomCode], queryFn: () => fetchRoom(roomCode) });
  const txQuery = useQuery({ queryKey: ['transactions', roomCode], queryFn: () => fetchTransactions(roomCode) });
  const settingsQuery = useQuery({
    queryKey: ['user-settings'],
    queryFn: async () => {
      const res = await fetch('/api/users/settings');
      if (!res.ok) return { transferPinEnabled: initialPinEnabled };
      return res.json() as Promise<{ transferPinEnabled: boolean }>;
    },
    initialData: { transferPinEnabled: initialPinEnabled },
  });

  const room = roomQuery.data;
  const user = room?.users.find((u) => u.id === userId);
  const myTx = (txQuery.data ?? []).filter((tx) => tx.fromUserId === userId || tx.toUserId === userId);

  const bankEnabled = room?.bankCentralEnabled ?? initialBankEnabled;
  const bankBalance = room?.bankCentralBalance ?? initialBankBalance;
  const requirePin = settingsQuery.data?.transferPinEnabled ?? initialPinEnabled;

  const BANK_TYPES = new Set(['bank_deposit', 'bank_withdraw', 'bank_to_user', 'user_to_bank']);
  const bankTx = (txQuery.data ?? []).filter((tx) => BANK_TYPES.has(tx.type));

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

  function handleBackToMaster() {
    router.push(`/room/${roomCode}/master`);
  }

  function handleSettingsClose() {
    setSettingsOpen(false);
    void queryClient.invalidateQueries({ queryKey: ['user-settings'] });
  }

  const isLoading = roomQuery.isLoading || txQuery.isLoading;

  return (
    <>
    <UserSettingsModal open={settingsOpen} onClose={handleSettingsClose} />
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
            onClick={() => setSettingsOpen(true)}
            aria-label="Account settings"
          >
            <Settings className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={refresh}
            disabled={isLoading}
            aria-label="Refresh"
          >
            <RefreshCw className={cn('h-4 w-4', isLoading && 'animate-spin')} />
          </Button>
          {isMaster ? (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={handleBackToMaster}
              aria-label="Back to master"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={handleLeave}
              aria-label="Leave room"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          )}
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
          {bankEnabled && (
            <TabsTrigger value="bank-central">
              <Landmark className="h-4 w-4 shrink-0" />
              Bank Central
            </TabsTrigger>
          )}
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
                  userAccountId={userAccountId}
                  users={room.users}
                  requirePin={requirePin}
                  bankCentralEnabled={bankEnabled}
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

        {/* Bank Central tab — read-only, visible to all when enabled */}
        {bankEnabled && (
          <TabsContent value="bank-central" className="flex flex-col gap-4">
            <div className="flex items-center gap-3 rounded-xl border border-border bg-surface/80 px-4 py-3 backdrop-blur-sm">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-subtle">
                <Building2 className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-foreground-muted">Bank Central Balance</p>
                <p className="font-mono text-sm font-semibold tabular-nums text-foreground">
                  {bankBalance.toLocaleString()}
                </p>
              </div>
            </div>

            <div>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-xs font-semibold uppercase tracking-widest text-foreground-subtle">Transactions</h2>
                {bankTx.length > 0 && (
                  <span className="rounded-full bg-surface-raised px-2.5 py-0.5 text-xs font-medium text-foreground-muted">
                    {bankTx.length}
                  </span>
                )}
              </div>
              <TransactionHistory transactions={bankTx} />
            </div>
          </TabsContent>
        )}

      </Tabs>
    </div>
    </>
  );
}
