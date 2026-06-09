import { NextResponse } from 'next/server';
import { z } from 'zod';
import { roomService } from '@/services';

const schema = z.object({
  bankCentralEnabled: z.boolean(),
  requesterId: z.string().uuid(),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const room = await roomService.getByCode(code);
  if (!room) return NextResponse.json({ error: 'Room not found' }, { status: 404 });

  const requester = room.users.find((u) => u.id === parsed.data.requesterId);
  if (!requester?.isMaster) return NextResponse.json({ error: 'Only master can change settings' }, { status: 403 });

  await roomService.updateBankCentral(code, parsed.data.bankCentralEnabled);
  return NextResponse.json({ ok: true });
}
