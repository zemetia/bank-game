import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { userService } from '@/services';
import { verifyJwt } from '@/lib/jwt';

const schema = z.object({
  password: z.string().min(1),
});

export async function DELETE(req: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;
  const jwt = token ? await verifyJwt(token) : null;
  if (!jwt) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  try {
    await userService.deleteAccount(jwt.userId, parsed.data.password);
    const res = NextResponse.json({ ok: true });
    res.cookies.set('auth_token', '', { path: '/', maxAge: 0 });
    return res;
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }
}
