'use client';

import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/cn';
import { Landmark } from 'lucide-react';

export interface HeaderProps {
  className?: string;
}

export function Header({ className }: HeaderProps) {
  return (
    <header
      className={cn(
        'sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-md',
        className,
      )}
    >
      <div className="container-page flex h-14 items-center">
        <Link
          href="/"
          className="flex items-center gap-2.5 font-bold tracking-tight text-foreground transition-opacity hover:opacity-80"
        >
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary">
            <Landmark className="h-4 w-4 text-primary-foreground" />
          </div>
          <span>BankGame</span>
        </Link>
      </div>
    </header>
  );
}
