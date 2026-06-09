'use client';

import { useEffect } from 'react';
import { use } from 'react';
import { useRouter } from '@/i18n/navigation';
import { useGameStore } from '@/stores';
import { MasterDashboard } from '@/components/game/MasterDashboard';
import { Typography } from '@/components/ui/Typography';

interface Props {
  params: Promise<{ locale: string; code: string }>;
}

export default function MasterPage({ params }: Props) {
  const { code } = use(params);
  const router = useRouter();
  const { roomCode, userId, isMaster } = useGameStore();

  useEffect(() => {
    if (!roomCode || !userId) {
      router.replace(`/room/${code}`);
      return;
    }
    if (!isMaster) {
      router.replace(`/room/${code}/bank`);
    }
  }, [roomCode, userId, isMaster, code, router]);

  if (!userId || !isMaster) return null;

  return (
    <main className="min-h-screen bg-[--color-background]">
      <div className="mx-auto max-w-2xl px-4 py-12">
        <Typography variant="h2" className="mb-6">Room Master</Typography>
        <MasterDashboard roomCode={code} masterId={userId} />
      </div>
    </main>
  );
}
