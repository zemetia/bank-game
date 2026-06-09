'use client';

import { useState } from 'react';
import { useRouter } from '@/i18n/navigation';
import { useToast } from '@/hooks';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

JoinForm.displayName = 'JoinForm';

export function JoinForm() {
  const router = useRouter();
  const toast = useToast();

  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`/api/rooms/${code.toUpperCase()}`);
      if (!res.ok) throw new Error('Room not found');
      router.push(`/room/${code.toUpperCase()}`);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Input
        label="Room Code"
        placeholder="ABCDEF"
        value={code}
        onChange={(e) => setCode(e.target.value.toUpperCase())}
        required
        maxLength={6}
        className="tracking-widest uppercase text-center text-lg font-mono h-12"
        size="lg"
      />
      <Button
        type="submit"
        size="lg"
        fullWidth
        isLoading={loading}
        disabled={code.length < 6}
      >
        Enter Room
      </Button>
    </form>
  );
}
