import { prisma } from '@/lib/prisma';
import { hashPassword, verifyPassword } from '@/lib/password';
import { hashPin, verifyPin } from '@/lib/pin';
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

  async changeName(userId: string, newName: string): Promise<UserVO> {
    const user = await prisma.user.update({
      where: { id: userId },
      data: { name: newName },
      select: { id: true, name: true, username: true, createdAt: true },
    });
    return toVO(user);
  },

  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { passwordHash: true },
    });
    if (!user) throw new Error('User not found');
    const ok = await verifyPassword(currentPassword, user.passwordHash);
    if (!ok) throw new Error('Current password is incorrect');
    const passwordHash = await hashPassword(newPassword);
    await prisma.user.update({ where: { id: userId }, data: { passwordHash } });
  },

  async changePin(userId: string, currentPin: string, newPin: string): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { pinHash: true },
    });
    if (!user) throw new Error('User not found');
    const ok = await verifyPin(currentPin, user.pinHash);
    if (!ok) throw new Error('Current PIN is incorrect');
    const pinHash = await hashPin(newPin);
    await prisma.user.update({ where: { id: userId }, data: { pinHash } });
  },

  async deleteAccount(userId: string, password: string): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { passwordHash: true },
    });
    if (!user) throw new Error('User not found');
    const ok = await verifyPassword(password, user.passwordHash);
    if (!ok) throw new Error('Password is incorrect');
    await prisma.user.delete({ where: { id: userId } });
  },
};
