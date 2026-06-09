import { customAlphabet } from 'nanoid';
import { prisma } from '@/lib/prisma';
import type { RoomVO, RoomWithUsersVO, RoomUserVO } from '@/types/value-objects';

const nanoid = customAlphabet('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', 6);

function toRoomUserVO(u: {
  id: string;
  roomId: string;
  userId: string;
  name: string;
  balance: bigint;
  isMaster: boolean;
  createdAt: Date;
  user: { transferPinEnabled: boolean };
}): RoomUserVO {
  return {
    id: u.id,
    roomId: u.roomId,
    userId: u.userId,
    name: u.name,
    balance: Number(u.balance),
    isMaster: u.isMaster,
    transferPinEnabled: u.user.transferPinEnabled,
    createdAt: u.createdAt,
  };
}

function toRoomVO(r: { id: string; code: string; name: string; createdAt: Date }): RoomVO {
  return { id: r.id, code: r.code, name: r.name, createdAt: r.createdAt };
}

export const roomService = {
  async create(
    name: string,
    userId: string,
  ): Promise<{ room: RoomVO; masterId: string }> {
    const code = nanoid();

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true },
    });
    if (!user) throw new Error('User not found');

    const result = await prisma.$transaction(async (tx) => {
      const room = await tx.room.create({ data: { code, name } });

      const master = await tx.roomUser.create({
        data: { roomId: room.id, userId, name: user.name, isMaster: true },
        select: { id: true },
      });

      return { room, masterId: master.id };
    });

    return { room: toRoomVO(result.room), masterId: result.masterId };
  },

  async getByMasterUserId(userId: string): Promise<RoomVO[]> {
    const roomUsers = await prisma.roomUser.findMany({
      where: { userId, isMaster: true },
      select: { room: true },
      orderBy: { createdAt: 'desc' },
    });
    return roomUsers.map((ru) => toRoomVO(ru.room));
  },

  async getByCode(code: string): Promise<RoomWithUsersVO | null> {
    const room = await prisma.room.findUnique({
      where: { code: code.toUpperCase() },
      include: {
        users: {
          select: {
            id: true,
            roomId: true,
            userId: true,
            name: true,
            balance: true,
            isMaster: true,
            createdAt: true,
            user: { select: { transferPinEnabled: true } },
          },
        },
      },
    });

    if (!room) return null;

    const users = room.users.map(toRoomUserVO);
    return {
      ...toRoomVO(room),
      users,
      master: users.find((u) => u.isMaster),
      bankCentralEnabled: room.bankCentralEnabled,
      bankCentralBalance: Number(room.bankCentralBalance),
    };
  },

  async updateBankCentral(code: string, enabled: boolean): Promise<void> {
    await prisma.room.update({
      where: { code: code.toUpperCase() },
      data: { bankCentralEnabled: enabled },
    });
  },
};
