'use client';

import { useEffect } from 'react';
import { useRouter } from '@/i18n/navigation';
import { useGameStore } from '@/stores';
import { BankDashboard } from '@/components/game/BankDashboard';
import { use } from 'react';

interface Props {
  params: Promise<{ locale: string; code: string }>;
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
    <main className="min-h-screen">
      <div className="mx-auto max-w-lg px-4 pb-16 pt-10">
        <BankDashboard roomCode={code} userId={userId} />
      </div>
    </main>
  );
}
