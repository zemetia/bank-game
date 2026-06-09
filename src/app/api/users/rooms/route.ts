import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { roomService } from '@/services';
import { verifyJwt } from '@/lib/jwt';

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;
  const jwt = token ? verifyJwt(token) : null;
  if (!jwt) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const rooms = await roomService.getByMasterUserId(jwt.userId);
  return NextResponse.json({ rooms });
}
