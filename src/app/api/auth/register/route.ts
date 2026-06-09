import { NextResponse } from 'next/server';
import { z } from 'zod';
import { userService } from '@/services';
import { signJwt } from '@/lib/jwt';

const schema = z.object({
  name: z.string().min(1).max(80),
  username: z
    .string()
    .min(3)
    .max(30)
    .regex(/^[a-zA-Z0-9_]+$/, 'Username may only contain letters, numbers, and underscores'),
  password: z.string().min(6).max(100),
  pin: z.string().regex(/^\d{6}$/, 'PIN must be exactly 6 digits'),
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const user = await userService.register(
      parsed.data.name,
      parsed.data.username.toLowerCase(),
      parsed.data.password,
      parsed.data.pin,
    );

    const token = signJwt({ userId: user.id, username: user.username, name: user.name });

    const res = NextResponse.json({ user }, { status: 201 });
    res.cookies.set('auth_token', token, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
      secure: process.env['NODE_ENV'] === 'production',
    });
    return res;
  } catch (err) {
    const msg = (err as Error).message;
    const status = msg === 'Username already taken' ? 409 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
