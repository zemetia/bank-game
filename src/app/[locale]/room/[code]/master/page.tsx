'use client';

import { useEffect } from 'react';
import { use } from 'react';
import { useRouter } from '@/i18n/navigation';
import { useGameStore } from '@/stores';
import { MasterDashboard } from '@/components/game/MasterDashboard';
import { Crown, Hash } from 'lucide-react';

interface Props {
  params: Promise<{ locale: string; code: string }>;
}

export default function MasterPage({ params }: Props) {
  const { code } = use(params);
  const router = useRouter();
  const { roomCode, userId, isMaster } = useGameStore();

  useEffect(() => {
    if (!roomCode || !userId) {
      router.replace('/');
      return;
    }
    if (!isMaster) {
      router.replace(`/room/${code}/bank`);
    }
  }, [roomCode, userId, isMaster, code, router]);

  if (!userId || !isMaster) return null;

  return (
    <main className="min-h-screen">
      <div className="mx-auto max-w-2xl px-4 pb-16 pt-10">
        {/* Page header */}
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-warning-subtle">
            <Crown className="h-5 w-5 text-warning" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-foreground">Room Master</h1>
            <div className="mt-0.5 flex items-center gap-1.5 text-xs text-foreground-muted">
              <Hash className="h-3 w-3" />
              <span className="font-mono tracking-widest">{code}</span>
            </div>
          </div>
        </div>

        <MasterDashboard roomCode={code} masterId={userId} />
      </div>
    </main>
  );
}
