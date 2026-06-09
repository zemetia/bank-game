import { NextResponse } from 'next/server';
import { z } from 'zod';
import { userService } from '@/services';
import { signJwt } from '@/lib/jwt';

const schema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  const user = await userService.login(parsed.data.username, parsed.data.password);
  if (!user) {
    return NextResponse.json({ error: 'Invalid username or password' }, { status: 401 });
  }

  const token = signJwt({ userId: user.id, username: user.username, name: user.name });

  const res = NextResponse.json({ user });
  res.cookies.set('auth_token', token, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60,
    secure: process.env['NODE_ENV'] === 'production',
  });
  return res;
}
