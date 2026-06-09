import { prisma } from '@/lib/prisma';
import { hashPassword, verifyPassword } from '@/lib/password';
import { hashPin } from '@/lib/pin';
import type { UserVO } from '@/types/value-objects';

function toVO(row: { id: string; name: string; username: string; createdAt: Date }): UserVO {
  return {
    id: row.id,
    name: row.name,
    username: row.username,
    createdAt: row.createdAt,
  };
}

export const userService = {
  async register(name: string, username: string, password: string, pin: string): Promise<UserVO> {
    const passwordHash = await hashPassword(password);
    const pinHash = await hashPin(pin);

    try {
      const user = await prisma.user.create({
        data: { name, username, passwordHash, pinHash },
        select: { id: true, name: true, username: true, createdAt: true },
      });
      return toVO(user);
    } catch (err: unknown) {
      const e = err as { code?: string };
      if (e.code === 'P2002') throw new Error('Username already taken');
      throw err;
    }
  },

  async login(username: string, password: string): Promise<UserVO | null> {
    const user = await prisma.user.findUnique({
      where: { username: username.toLowerCase() },
      select: { id: true, name: true, username: true, passwordHash: true, createdAt: true },
    });

    if (!user) return null;
    const ok = await verifyPassword(password, user.passwordHash);
    if (!ok) return null;
    return toVO(user);
  },

  async getByUsername(username: string): Promise<{ id: string; name: string } | null> {
    const user = await prisma.user.findUnique({
      where: { username: username.toLowerCase() },
      select: { id: true, name: true },
    });
    return user ?? null;
  },
};
