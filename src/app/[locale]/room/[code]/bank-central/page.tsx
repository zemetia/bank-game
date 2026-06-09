import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import { redirect } from '@/i18n/navigation';
import { roomService } from '@/services';
import { verifyJwt } from '@/lib/jwt';
import { BankCentralDashboard } from '@/components/game/BankCentralDashboard';

interface Props {
  params: Promise<{ locale: string; code: string }>;
}

export default async function BankCentralPage({ params }: Props) {
  const { locale, code } = await params;

  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;
  const jwt = token ? await verifyJwt(token) : null;
  if (!jwt) { redirect({ href: '/login', locale }); return null; }

  const room = await roomService.getByCode(code);
  if (!room) notFound();

  const roomUser = room.users.find((u) => u.userId === jwt.userId);
  if (!roomUser) { redirect({ href: '/', locale }); return null; }

  if (!roomUser.isMaster) { redirect({ href: `/room/${code}/bank`, locale }); return null; }

  if (!room.bankCentralEnabled) { redirect({ href: `/room/${code}/master`, locale }); return null; }

  return (
    <main className="min-h-screen">
      <div className="mx-auto max-w-lg px-4 pb-16 pt-10">
        <BankCentralDashboard
          roomCode={code}
          masterId={roomUser.id}
          masterUserId={jwt.userId}
          initialBankBalance={room.bankCentralBalance}
          initialBankCentralEnabled={room.bankCentralEnabled}
        />
      </div>
    </main>
  );
}
