import { NextResponse } from 'next/server';
import { z } from 'zod';
import { roomService, roomUserService } from '@/services';

const bodySchema = z.object({ requesterId: z.string().uuid() });

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ code: string; userId: string }> },
) {
  const { code, userId } = await params;
  const body = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const room = await roomService.getByCode(code);
  if (!room) return NextResponse.json({ error: 'Room not found' }, { status: 404 });

  const requester = room.users.find((u) => u.id === parsed.data.requesterId);
  if (!requester?.isMaster) {
    return NextResponse.json({ error: 'Only room master can remove users' }, { status: 403 });
  }

  const target = room.users.find((u) => u.id === userId);
  if (!target) return NextResponse.json({ error: 'User not found' }, { status: 404 });
  if (target.isMaster) return NextResponse.json({ error: 'Cannot remove room master' }, { status: 400 });

  try {
    await roomUserService.remove(userId);
    return new NextResponse(null, { status: 204 });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
