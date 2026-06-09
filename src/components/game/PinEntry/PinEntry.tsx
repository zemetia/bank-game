'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from '@/i18n/navigation';
import { useGameStore } from '@/stores';
import { useToast } from '@/hooks';
import { cn } from '@/lib/cn';

PinEntry.displayName = 'PinEntry';

interface Props {
  roomCode: string;
  userId: string;
  roomUserId: string;
}

export function PinEntry({ roomCode, userId, roomUserId }: Props) {
  const router = useRouter();
  const { setSession } = useGameStore();
  const toast = useToast();

  const [digits, setDigits] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const submit = useCallback(async (pin: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/rooms/${roomCode}/auth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, pin }),
      });
      const data = await res.json() as { userId?: string; isMaster?: boolean; error?: string };
      if (!res.ok) throw new Error(data.error ?? 'Invalid PIN.');

      setSession({ roomCode, userId: roomUserId, isMaster: false });
      router.push(`/room/${roomCode}/bank`);
    } catch (err) {
      toast.error((err as Error).message);
      setError((err as Error).message ?? 'Invalid PIN');
      setDigits('');
      setTimeout(() => inputRef.current?.focus(), 0);
    } finally {
      setLoading(false);
    }
  }, [roomCode, userId, roomUserId, router, setSession, toast]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (loading) return;
    const val = e.target.value.replace(/\D/g, '').slice(0, 6);
    setDigits(val);
    setError('');
    if (val.length === 6) void submit(val);
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div
        className="flex cursor-text items-center justify-center gap-4"
        onClick={() => inputRef.current?.focus()}
      >
        {Array.from({ length: 6 }, (_, i) => (
          <span
            key={i}
            className={cn(
              'h-3.5 w-3.5 rounded-full border-2 transition-all duration-150',
              i < digits.length
                ? 'scale-110 border-primary bg-primary'
                : 'border-border bg-transparent',
              loading && i < digits.length && 'opacity-50',
            )}
          />
        ))}
      </div>

      <input
        ref={inputRef}
        type="password"
        inputMode="numeric"
        value={digits}
        onChange={handleChange}
        disabled={loading}
        maxLength={6}
        className="sr-only"
        aria-label="Enter PIN"
        autoComplete="off"
      />

      <div className="h-4 text-center">
        {error ? (
          <p className="text-xs font-medium text-destructive">{error}</p>
        ) : loading ? (
          <p className="text-xs text-foreground-subtle">Verifying…</p>
        ) : null}
      </div>
    </div>
  );
}
