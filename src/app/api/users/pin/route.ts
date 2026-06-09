import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { userService } from '@/services';
import { verifyJwt } from '@/lib/jwt';

const schema = z.object({
  currentPin: z.string().regex(/^\d{6}$/),
  newPin: z.string().regex(/^\d{6}$/),
});

export async function PATCH(req: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;
  const jwt = token ? await verifyJwt(token) : null;
  if (!jwt) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  try {
    await userService.changePin(jwt.userId, parsed.data.currentPin, parsed.data.newPin);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }
}
