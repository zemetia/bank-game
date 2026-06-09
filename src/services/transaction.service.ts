import { prisma } from '@/lib/prisma';
import type { TransactionVO, TransactionType } from '@/types/value-objects';

function toVO(tx: {
  id: string;
  roomId: string;
  fromUserId: string | null;
  toUserId: string | null;
  amount: bigint;
  type: string;
  note: string | null;
  createdById: string;
  createdAt: Date;
  fromUser?: { name: string } | null;
  toUser?: { name: string } | null;
}): TransactionVO {
  return {
    id: tx.id,
    roomId: tx.roomId,
    fromUserId: tx.fromUserId,
    toUserId: tx.toUserId,
    fromUserName: tx.fromUser?.name ?? null,
    toUserName: tx.toUser?.name ?? null,
    amount: Number(tx.amount),
    type: tx.type as TransactionType,
    note: tx.note,
    createdBy: tx.createdById,
    createdAt: tx.createdAt,
  };
}

const txInclude = {
  fromUser: { select: { name: true } },
  toUser: { select: { name: true } },
} as const;

export const transactionService = {
  async listForRoom(roomId: string, limit = 50): Promise<TransactionVO[]> {
    const rows = await prisma.transaction.findMany({
      where: { roomId },
      include: txInclude,
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
    return rows.map(toVO);
  },

  async listForUser(userId: string, limit = 50): Promise<TransactionVO[]> {
    const rows = await prisma.transaction.findMany({
      where: { OR: [{ fromUserId: userId }, { toUserId: userId }] },
      include: txInclude,
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
    return rows.map(toVO);
  },

  async deposit(
    roomId: string,
    toUserId: string,
    amount: number,
    createdBy: string,
    note?: string,
  ): Promise<TransactionVO> {
    return _createAndUpdateBalance({
      roomId,
      toUserId,
      amount,
      type: 'deposit',
      createdBy,
      note,
      balanceUpdates: [{ id: toUserId, delta: amount }],
    });
  },

  async withdraw(
    roomId: string,
    fromUserId: string,
    amount: number,
    createdBy: string,
    note?: string,
  ): Promise<TransactionVO> {
    await _assertSufficientBalance(fromUserId, amount);
    return _createAndUpdateBalance({
      roomId,
      fromUserId,
      amount,
      type: 'withdraw',
      createdBy,
      note,
      balanceUpdates: [{ id: fromUserId, delta: -amount }],
    });
  },

  async transfer(
    roomId: string,
    fromUserId: string,
    toUserId: string,
    amount: number,
    createdBy: string,
    note?: string,
  ): Promise<TransactionVO> {
    await _assertSufficientBalance(fromUserId, amount);
    return _createAndUpdateBalance({
      roomId,
      fromUserId,
      toUserId,
      amount,
      type: 'transfer',
      createdBy,
      note,
      balanceUpdates: [
        { id: fromUserId, delta: -amount },
        { id: toUserId, delta: amount },
      ],
    });
  },
};

async function _assertSufficientBalance(userId: string, amount: number): Promise<void> {
  const ru = await prisma.roomUser.findUnique({
    where: { id: userId },
    select: { balance: true },
  });
  if (!ru || Number(ru.balance) < amount) throw new Error('Insufficient balance');
}

async function _createAndUpdateBalance(params: {
  roomId: string;
  fromUserId?: string;
  toUserId?: string;
  amount: number;
  type: TransactionType;
  createdBy: string;
  note?: string;
  balanceUpdates: { id: string; delta: number }[];
}): Promise<TransactionVO> {
  const { roomId, fromUserId, toUserId, amount, type, createdBy, note, balanceUpdates } = params;

  const tx = await prisma.$transaction(async (p) => {
    const created = await p.transaction.create({
      data: {
        roomId,
        fromUserId: fromUserId ?? null,
        toUserId: toUserId ?? null,
        amount,
        type,
        note: note ?? null,
        createdById: createdBy,
      },
      include: txInclude,
    });

    await Promise.all(
      balanceUpdates.map(({ id, delta }) =>
        p.roomUser.update({
          where: { id },
          data: { balance: { increment: delta } },
        }),
      ),
    );

    return created;
  });

  return toVO(tx);
}
