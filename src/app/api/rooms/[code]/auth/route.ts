import { NextResponse } from 'next/server';
import { z } from 'zod';
import { roomService, roomUserService } from '@/services';

const schema = z.object({
  userId: z.string().uuid(),
  pin: z.string().regex(/^\d{6}$/),
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

  const result = await roomUserService.verifyAndAuth(room.id, parsed.data.userId, parsed.data.pin);
  if (!result) return NextResponse.json({ error: 'Invalid user or PIN' }, { status: 401 });

  return NextResponse.json(result);
}
