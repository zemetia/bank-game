'use client';

import { useEffect } from 'react';
import { use } from 'react';
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/stores';
import { BankDashboard } from '@/components/game/BankDashboard';
import { Typography } from '@/components/ui/Typography';

interface Props {
  params: Promise<{ code: string }>;
}

export default function BankPage({ params }: Props) {
  const { code } = use(params);
  const router = useRouter();
  const { roomCode, userId, isMaster } = useGameStore();

  useEffect(() => {
    if (!roomCode || !userId) {
      router.replace(`/room/${code}`);
      return;
    }
    if (isMaster) {
      router.replace(`/room/${code}/master`);
    }
  }, [roomCode, userId, isMaster, code, router]);

  if (!userId) return null;

  return (
    <main className="min-h-screen bg-[--color-background]">
      <div className="mx-auto max-w-lg px-4 py-12">
        <Typography variant="h2" className="mb-6">My Bank</Typography>
        <BankDashboard roomCode={code} userId={userId} />
      </div>
    </main>
  );
}
