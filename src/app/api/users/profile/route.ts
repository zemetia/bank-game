import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { userService } from '@/services';
import { verifyJwt, signJwt } from '@/lib/jwt';

const schema = z.object({
  name: z.string().min(1).max(80),
});

export async function PATCH(req: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;
  const jwt = token ? await verifyJwt(token) : null;
  if (!jwt) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const user = await userService.changeName(jwt.userId, parsed.data.name);

  const newToken = await signJwt({ userId: user.id, username: user.username, name: user.name });
  const res = NextResponse.json({ user });
  res.cookies.set('auth_token', newToken, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60,
    secure: process.env['NODE_ENV'] === 'production',
  });
  return res;
}
