import { createHmac } from 'node:crypto';

const SECRET = process.env['JWT_SECRET'] ?? 'dev_secret_change_in_production';

export interface JwtPayload {
  userId: string;
  username: string;
  name: string;
}

function b64url(data: string): string {
  return Buffer.from(data).toString('base64url');
}

function b64decode(data: string): string {
  return Buffer.from(data, 'base64url').toString('utf8');
}

export function signJwt(payload: JwtPayload, expiresInSec = 7 * 24 * 3600): string {
  const header = b64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = b64url(
    JSON.stringify({
      ...payload,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + expiresInSec,
    }),
  );
  const sig = createHmac('sha256', SECRET).update(`${header}.${body}`).digest('base64url');
  return `${header}.${body}.${sig}`;
}

export function verifyJwt(token: string): JwtPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [header, body, sig] = parts as [string, string, string];
    const expected = createHmac('sha256', SECRET).update(`${header}.${body}`).digest('base64url');
    if (sig !== expected) return null;
    const payload = JSON.parse(b64decode(body)) as JwtPayload & { exp?: number };
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null;
    return { userId: payload.userId, username: payload.username, name: payload.name };
  } catch {
    return null;
  }
}
