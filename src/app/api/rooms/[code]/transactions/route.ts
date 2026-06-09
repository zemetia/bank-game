import { NextResponse } from 'next/server';
import { z } from 'zod';
import { roomService, transactionService } from '@/services';

const deleteSchema = z.object({ requesterId: z.string().uuid() });

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
  z.object({
    type: z.literal('bank_deposit'),
    amount: z.number().int().positive(),
    note: z.string().max(200).optional(),
    requesterId: z.string().uuid(),
  }),
  z.object({
    type: z.literal('bank_withdraw'),
    amount: z.number().int().positive(),
    note: z.string().max(200).optional(),
    requesterId: z.string().uuid(),
  }),
  z.object({
    type: z.literal('bank_to_user'),
    toUserId: z.string().uuid(),
    amount: z.number().int().positive(),
    note: z.string().max(200).optional(),
    requesterId: z.string().uuid(),
  }),
  z.object({
    type: z.literal('user_to_bank'),
    fromUserId: z.string().uuid(),
    amount: z.number().int().positive(),
    note: z.string().max(200).optional(),
    requesterId: z.string().uuid(),
  }),
]);

export async function DELETE(req: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const body = await req.json().catch(() => null);
  const parsed = deleteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const room = await roomService.getByCode(code);
  if (!room) return NextResponse.json({ error: 'Room not found' }, { status: 404 });

  const requester = room.users.find((u) => u.id === parsed.data.requesterId);
  if (!requester?.isMaster) {
    return NextResponse.json({ error: 'Only master can clear history' }, { status: 403 });
  }

  try {
    await transactionService.clearHistory(room.id);
    return new NextResponse(null, { status: 204 });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

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

  const masterOnlyBankTypes = ['bank_deposit', 'bank_withdraw', 'bank_to_user'];
  if (masterOnlyBankTypes.includes(type) && !requester.isMaster) {
    return NextResponse.json({ error: 'Only master can perform bank central operations' }, { status: 403 });
  }
  if (type === 'user_to_bank' && !requester.isMaster && parsed.data.fromUserId !== requesterId) {
    return NextResponse.json({ error: 'Can only deposit from your own account' }, { status: 403 });
  }
  if (['bank_deposit', 'bank_withdraw', 'bank_to_user', 'user_to_bank'].includes(type) && !room.bankCentralEnabled) {
    return NextResponse.json({ error: 'Bank Central is not enabled' }, { status: 400 });
  }

  try {
    let tx;
    if (type === 'deposit') {
      if (!requester.isMaster) return NextResponse.json({ error: 'Only master can deposit' }, { status: 403 });
      tx = await transactionService.deposit(room.id, parsed.data.toUserId, amount, requesterId, note);
    } else if (type === 'withdraw') {
      if (!requester.isMaster) return NextResponse.json({ error: 'Only master can withdraw' }, { status: 403 });
      tx = await transactionService.withdraw(room.id, parsed.data.fromUserId, amount, requesterId, note);
    } else if (type === 'transfer') {
      if (parsed.data.fromUserId !== requesterId) {
        return NextResponse.json({ error: 'Can only transfer from your own account' }, { status: 403 });
      }
      tx = await transactionService.transfer(room.id, parsed.data.fromUserId, parsed.data.toUserId, amount, requesterId, note);
    } else if (type === 'bank_deposit') {
      tx = await transactionService.bankDeposit(room.id, amount, requesterId, note);
    } else if (type === 'bank_withdraw') {
      tx = await transactionService.bankWithdraw(room.id, amount, requesterId, note);
    } else if (type === 'bank_to_user') {
      tx = await transactionService.bankToUser(room.id, parsed.data.toUserId, amount, requesterId, note);
    } else {
      tx = await transactionService.userToBank(room.id, parsed.data.fromUserId, amount, requesterId, note);
    }
    return NextResponse.json({ transaction: tx }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }
}
