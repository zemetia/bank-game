'use client';

import { Badge } from '@/components/ui/Badge';
import type { RoomUserVO } from '@/types/value-objects';

PlayerList.displayName = 'PlayerList';

interface Props {
  users: RoomUserVO[];
}

export function PlayerList({ users }: Props) {
  if (users.length === 0) {
    return <p className="text-sm text-[--color-foreground-muted]">No players yet.</p>;
  }

  return (
    <ul className="flex flex-col gap-2">
      {users.map((user) => (
        <li
          key={user.id}
          className="flex items-center justify-between rounded-lg border border-[--color-border] bg-[--color-surface] px-4 py-3"
        >
          <div className="flex items-center gap-3">
            <span className="font-medium text-[--color-foreground]">{user.name}</span>
            {user.isMaster && <Badge variant="default">Master</Badge>}
          </div>
          <span className="font-mono text-sm text-[--color-foreground-muted]">
            {user.balance.toLocaleString()}
          </span>
        </li>
      ))}
    </ul>
  );
}
