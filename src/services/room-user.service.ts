import { prisma } from '@/lib/prisma';
import { verifyPin } from '@/lib/pin';
import type { RoomUserVO, AuthResultVO } from '@/types/value-objects';

function toVO(u: {
  id: string;
  roomId: string;
  userId: string;
  name: string;
  balance: bigint;
  isMaster: boolean;
  createdAt: Date;
}): RoomUserVO {
  return {
    id: u.id,
    roomId: u.roomId,
    userId: u.userId,
    name: u.name,
    balance: Number(u.balance),
    isMaster: u.isMaster,
    createdAt: u.createdAt,
  };
}

export const roomUserService = {
  async remove(roomUserId: string): Promise<void> {
    await prisma.roomUser.delete({ where: { id: roomUserId } });
  },

  async verifyAndAuth(roomId: string, userId: string, pin: string): Promise<AuthResultVO | null> {
    const roomUser = await prisma.roomUser.findFirst({
      where: { roomId, userId },
      select: { id: true, isMaster: true, user: { select: { pinHash: true } } },
    });

    if (!roomUser) return null;
    const ok = await verifyPin(pin, roomUser.user.pinHash);
    if (!ok) return null;
    return { userId: roomUser.id, isMaster: roomUser.isMaster };
  },

  async getById(roomUserId: string): Promise<RoomUserVO | null> {
    const u = await prisma.roomUser.findUnique({ where: { id: roomUserId } });
    if (!u) return null;
    return toVO(u);
  },

  async invite(
    roomId: string,
    user: { id: string; name: string },
    initialBalance: number,
  ): Promise<RoomUserVO> {
    try {
      const u = await prisma.roomUser.create({
        data: { roomId, userId: user.id, name: user.name, balance: initialBalance },
      });
      return toVO(u);
    } catch (err: unknown) {
      const e = err as { code?: string };
      if (e.code === 'P2002') throw new Error('User is already in this room');
      throw err;
    }
  },
};
