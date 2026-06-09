'use client';

import { cn } from '@/lib/cn';
import type { TransactionVO } from '@/types/value-objects';

TransactionHistory.displayName = 'TransactionHistory';

const TX_LABELS: Record<string, string> = {
  deposit: 'Deposit',
  withdraw: 'Withdraw',
  transfer: 'Transfer',
};

interface Props {
  transactions: TransactionVO[];
  currentUserId?: string;
}

export function TransactionHistory({ transactions, currentUserId }: Props) {
  if (transactions.length === 0) {
    return <p className="text-sm text-[--color-foreground-muted]">No transactions yet.</p>;
  }

  return (
    <ul className="flex flex-col gap-2">
      {transactions.map((tx) => {
        const isIncoming = tx.toUserId === currentUserId;
        const isOutgoing = tx.fromUserId === currentUserId;
        const sign = currentUserId
          ? isIncoming
            ? '+'
            : isOutgoing
              ? '−'
              : ''
          : '';

        return (
          <li
            key={tx.id}
            className="flex items-center justify-between rounded-lg border border-[--color-border] bg-[--color-surface] px-4 py-3 text-sm"
          >
            <div className="flex flex-col gap-0.5">
              <span className="font-medium capitalize text-[--color-foreground]">
                {TX_LABELS[tx.type] ?? tx.type}
                {tx.fromUserName && ` from ${tx.fromUserName}`}
                {tx.toUserName && ` to ${tx.toUserName}`}
              </span>
              {tx.note && (
                <span className="text-[--color-foreground-muted]">{tx.note}</span>
              )}
              <span className="text-xs text-[--color-foreground-subtle]">
                {tx.createdAt.toLocaleString()}
              </span>
            </div>
            <span
              className={cn(
                'font-mono font-semibold tabular-nums',
                sign === '+' && 'text-[--color-success]',
                sign === '−' && 'text-[--color-destructive]',
                !sign && 'text-[--color-foreground]',
              )}
            >
              {sign}{tx.amount.toLocaleString()}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
