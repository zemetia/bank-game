'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/cn';

PinOverlay.displayName = 'PinOverlay';

interface Props {
  title: string;
  subtitle?: string;
  onConfirm: (pin: string) => Promise<void>;
  onCancel: () => void;
}

export function PinOverlay({ title, subtitle, onConfirm, onCancel }: Props) {
  const [digits, setDigits] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const submit = useCallback(async (pin: string) => {
    setLoading(true);
    try {
      await onConfirm(pin);
    } catch (err: unknown) {
      setError((err as Error).message ?? 'Invalid PIN');
      setDigits('');
      setTimeout(() => inputRef.current?.focus(), 0);
    } finally {
      setLoading(false);
    }
  }, [onConfirm]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (loading) return;
    const val = e.target.value.replace(/\D/g, '').slice(0, 6);
    setDigits(val);
    setError('');
    if (val.length === 6) void submit(val);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="relative w-full max-w-xs rounded-2xl border border-border bg-surface px-8 py-10 shadow-2xl">
        {/* Cancel */}
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="absolute right-4 top-4 flex h-7 w-7 items-center justify-center rounded-full text-foreground-muted transition-colors hover:bg-surface-raised hover:text-foreground"
          aria-label="Cancel"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Title */}
        <div className="mb-8 text-center">
          <p className="text-base font-semibold text-foreground">{title}</p>
          {subtitle && (
            <p className="mt-1 text-sm text-foreground-muted">{subtitle}</p>
          )}
        </div>

        {/* 6 dots */}
        <div
          className="mb-4 flex cursor-text items-center justify-center gap-4"
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

        {/* Hidden real input — invisible but focusable/typeable */}
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

        {/* Error / hint */}
        <div className="h-4 text-center">
          {error ? (
            <p className="text-xs font-medium text-destructive">{error}</p>
          ) : loading ? (
            <p className="text-xs text-foreground-subtle">Verifying…</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
