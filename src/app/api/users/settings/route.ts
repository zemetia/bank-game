import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { verifyJwt } from '@/lib/jwt';

const patchSchema = z.object({
  transferPinEnabled: z.boolean().optional(),
  quickAmounts: z.array(z.number().int().min(0).nullable()).max(3).optional(),
});

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;
  const jwt = token ? await verifyJwt(token) : null;
  if (!jwt) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: jwt.userId },
    select: { transferPinEnabled: true, quickAmount1: true, quickAmount2: true, quickAmount3: true },
  });
  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  return NextResponse.json({
    transferPinEnabled: user.transferPinEnabled,
    quickAmounts: [
      user.quickAmount1 !== null ? Number(user.quickAmount1) : null,
      user.quickAmount2 !== null ? Number(user.quickAmount2) : null,
      user.quickAmount3 !== null ? Number(user.quickAmount3) : null,
    ] as [number | null, number | null, number | null],
  });
}

export async function PATCH(req: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;
  const jwt = token ? await verifyJwt(token) : null;
  if (!jwt) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const data: Record<string, unknown> = {};
  if (parsed.data.transferPinEnabled !== undefined) {
    data.transferPinEnabled = parsed.data.transferPinEnabled;
  }
  if (parsed.data.quickAmounts !== undefined) {
    const [a1, a2, a3] = parsed.data.quickAmounts;
    data.quickAmount1 = a1 ?? null;
    data.quickAmount2 = a2 ?? null;
    data.quickAmount3 = a3 ?? null;
  }

  await prisma.user.update({ where: { id: jwt.userId }, data });

  return NextResponse.json({ ok: true });
}
