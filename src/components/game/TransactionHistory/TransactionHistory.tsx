'use client';

import { ArrowDownLeft, ArrowUpRight, ArrowLeftRight, Coins } from 'lucide-react';
import { cn } from '@/lib/cn';
import type { TransactionVO } from '@/types/value-objects';

TransactionHistory.displayName = 'TransactionHistory';

interface Props {
  transactions: TransactionVO[];
  currentUserId?: string;
}

type TxMeta = {
  icon: React.ReactNode;
  label: string;
  sign: '+' | '−' | '';
  colorClass: string;
  bgClass: string;
};

function getTxMeta(tx: TransactionVO, currentUserId?: string): TxMeta {
  const isIncoming = tx.toUserId === currentUserId;
  const isOutgoing = tx.fromUserId === currentUserId;

  if (tx.type === 'deposit') {
    return {
      icon: <Coins className="h-4 w-4" />,
      label: 'Deposit',
      sign: '+',
      colorClass: 'text-success',
      bgClass: 'bg-success-subtle text-success',
    };
  }
  if (tx.type === 'withdraw') {
    return {
      icon: <ArrowUpRight className="h-4 w-4" />,
      label: 'Withdrawal',
      sign: '−',
      colorClass: 'text-destructive',
      bgClass: 'bg-destructive-subtle text-destructive',
    };
  }
  if (tx.type === 'bank_deposit') {
    return {
      icon: <Coins className="h-4 w-4" />,
      label: 'Bank Deposit',
      sign: '+',
      colorClass: 'text-success',
      bgClass: 'bg-success-subtle text-success',
    };
  }
  if (tx.type === 'bank_withdraw') {
    return {
      icon: <ArrowUpRight className="h-4 w-4" />,
      label: 'Bank Withdrawal',
      sign: '−',
      colorClass: 'text-destructive',
      bgClass: 'bg-destructive-subtle text-destructive',
    };
  }
  if (tx.type === 'bank_to_user') {
    return {
      icon: <ArrowUpRight className="h-4 w-4" />,
      label: `To ${tx.toUserName ?? 'Unknown'}`,
      sign: '−',
      colorClass: 'text-destructive',
      bgClass: 'bg-destructive-subtle text-destructive',
    };
  }
  if (tx.type === 'user_to_bank') {
    return {
      icon: <ArrowDownLeft className="h-4 w-4" />,
      label: `From ${tx.fromUserName ?? 'Unknown'}`,
      sign: '+',
      colorClass: 'text-success',
      bgClass: 'bg-success-subtle text-success',
    };
  }
  if (isIncoming) {
    return {
      icon: <ArrowDownLeft className="h-4 w-4" />,
      label: `From ${tx.fromUserName ?? 'Unknown'}`,
      sign: '+',
      colorClass: 'text-success',
      bgClass: 'bg-success-subtle text-success',
    };
  }
  if (isOutgoing) {
    return {
      icon: <ArrowUpRight className="h-4 w-4" />,
      label: `To ${tx.toUserName ?? 'Unknown'}`,
      sign: '−',
      colorClass: 'text-destructive',
      bgClass: 'bg-destructive-subtle text-destructive',
    };
  }
  return {
    icon: <ArrowLeftRight className="h-4 w-4" />,
    label: 'Transfer',
    sign: '',
    colorClass: 'text-foreground',
    bgClass: 'bg-surface-raised text-foreground-muted',
  };
}

function formatDate(date: Date | string): string {
  const d = date instanceof Date ? date : new Date(date);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
    + ' · '
    + d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

export function TransactionHistory({ transactions, currentUserId }: Props) {
  if (transactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-border border-dashed bg-surface px-6 py-10 text-center">
        <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-surface-raised">
          <ArrowLeftRight className="h-5 w-5 text-foreground-subtle" />
        </div>
        <p className="text-sm font-medium text-foreground-muted">No transactions yet</p>
        <p className="mt-1 text-xs text-foreground-subtle">Your transaction history will appear here</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-surface">
      <ul className="divide-y divide-border">
        {transactions.map((tx, i) => {
          const meta = getTxMeta(tx, currentUserId);
          return (
            <li
              key={tx.id}
              className={cn(
                'flex items-center gap-4 px-4 py-3.5 transition-colors hover:bg-surface-raised',
                i === 0 && 'rounded-t-xl',
                i === transactions.length - 1 && 'rounded-b-xl',
              )}
            >
              <div className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-full', meta.bgClass)}>
                {meta.icon}
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">{meta.label}</p>
                {tx.note && (
                  <p className="mt-0.5 truncate text-xs text-foreground-muted">{tx.note}</p>
                )}
                <p className="mt-0.5 text-xs text-foreground-subtle">{formatDate(tx.createdAt)}</p>
              </div>

              <span className={cn('font-mono text-sm font-semibold tabular-nums shrink-0', meta.colorClass)}>
                {meta.sign}{tx.amount.toLocaleString()}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
