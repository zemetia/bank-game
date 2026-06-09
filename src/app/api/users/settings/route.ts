import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { verifyJwt } from '@/lib/jwt';

const schema = z.object({
  transferPinEnabled: z.boolean(),
});

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;
  const jwt = token ? await verifyJwt(token) : null;
  if (!jwt) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: jwt.userId },
    select: { transferPinEnabled: true },
  });
  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  return NextResponse.json({ transferPinEnabled: user.transferPinEnabled });
}

export async function PATCH(req: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;
  const jwt = token ? await verifyJwt(token) : null;
  if (!jwt) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  await prisma.user.update({
    where: { id: jwt.userId },
    data: { transferPinEnabled: parsed.data.transferPinEnabled },
  });

  return NextResponse.json({ ok: true });
}
