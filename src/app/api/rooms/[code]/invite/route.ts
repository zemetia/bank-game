import { NextResponse } from 'next/server';
import { z } from 'zod';
import { roomService, roomUserService, userService } from '@/services';

export const dynamic = 'force-dynamic';

const schema = z.object({
  username: z.string().min(1),
  initialBalance: z.number().int().min(0).default(0),
  requesterId: z.string().uuid(),
});

export async function POST(req: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const room = await roomService.getByCode(code);
  if (!room) return NextResponse.json({ error: 'Room not found' }, { status: 404 });

  const requester = room.users.find((u) => u.id === parsed.data.requesterId);
  if (!requester?.isMaster) {
    return NextResponse.json({ error: 'Only room master can invite users' }, { status: 403 });
  }

  const user = await userService.getByUsername(parsed.data.username);
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  try {
    const roomUser = await roomUserService.invite(room.id, user, parsed.data.initialBalance);
    return NextResponse.json({ roomUser }, { status: 201 });
  } catch (err) {
    const msg = (err as Error).message;
    const status = msg === 'User is already in this room' ? 409 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
