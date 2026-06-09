import { NextResponse } from 'next/server';
import { z } from 'zod';
import { roomService, transactionService } from '@/services';

const schema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('deposit'),
    toUserId: z.string().uuid(),
    amount: z.number().int().positive(),
    note: z.string().max(200).optional(),
    requesterId: z.string().uuid(),
  }),
  z.object({
    type: z.literal('withdraw'),
    fromUserId: z.string().uuid(),
    amount: z.number().int().positive(),
    note: z.string().max(200).optional(),
    requesterId: z.string().uuid(),
  }),
  z.object({
    type: z.literal('transfer'),
    fromUserId: z.string().uuid(),
    toUserId: z.string().uuid(),
    amount: z.number().int().positive(),
    note: z.string().max(200).optional(),
    requesterId: z.string().uuid(),
  }),
]);

export async function GET(_req: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const room = await roomService.getByCode(code);
  if (!room) return NextResponse.json({ error: 'Room not found' }, { status: 404 });

  const transactions = await transactionService.listForRoom(room.id);
  return NextResponse.json({ transactions });
}

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
  if (!requester) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { requesterId, type, amount, note } = parsed.data;

  try {
    let tx;
    if (type === 'deposit') {
      if (!requester.isMaster) return NextResponse.json({ error: 'Only master can deposit' }, { status: 403 });
      tx = await transactionService.deposit(room.id, parsed.data.toUserId, amount, requesterId, note);
    } else if (type === 'withdraw') {
      if (!requester.isMaster) return NextResponse.json({ error: 'Only master can withdraw' }, { status: 403 });
      tx = await transactionService.withdraw(room.id, parsed.data.fromUserId, amount, requesterId, note);
    } else {
      if (parsed.data.fromUserId !== requesterId) {
        return NextResponse.json({ error: 'Can only transfer from your own account' }, { status: 403 });
      }
      tx = await transactionService.transfer(room.id, parsed.data.fromUserId, parsed.data.toUserId, amount, requesterId, note);
    }
    return NextResponse.json({ transaction: tx }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }
}
