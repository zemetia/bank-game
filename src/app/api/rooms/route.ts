import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { roomService } from '@/services';
import { verifyJwt } from '@/lib/jwt';

const schema = z.object({
  name: z.string().min(1).max(80),
});

export async function POST(req: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;
  const jwt = token ? await verifyJwt(token) : null;
  if (!jwt) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const { room, masterId } = await roomService.create(parsed.data.name, jwt.userId);
    return NextResponse.json({ room, masterId }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
