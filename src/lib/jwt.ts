const SECRET_RAW = process.env['JWT_SECRET'] ?? 'dev_secret_change_in_production';

export interface JwtPayload {
  userId: string;
  username: string;
  name: string;
}

function bytesToB64url(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

function strToB64url(data: string): string {
  return bytesToB64url(new TextEncoder().encode(data));
}

function b64urlDecode(data: string): string {
  const padded = data.replace(/-/g, '+').replace(/_/g, '/');
  const pad = padded.length % 4;
  const binary = atob(pad ? padded + '='.repeat(4 - pad) : padded);
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

function b64urlToBytes(data: string): Uint8Array<ArrayBuffer> {
  const padded = data.replace(/-/g, '+').replace(/_/g, '/');
  const pad = padded.length % 4;
  const binary = atob(pad ? padded + '='.repeat(4 - pad) : padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function getKey(): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(SECRET_RAW),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify'],
  );
}

export async function signJwt(payload: JwtPayload, expiresInSec = 7 * 24 * 3600): Promise<string> {
  const header = strToB64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = strToB64url(
    JSON.stringify({
      ...payload,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + expiresInSec,
    }),
  );
  const key = await getKey();
  const sigBuffer = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${header}.${body}`));
  const sig = bytesToB64url(new Uint8Array(sigBuffer));
  return `${header}.${body}.${sig}`;
}

export async function verifyJwt(token: string): Promise<JwtPayload | null> {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [header, body, sig] = parts as [string, string, string];
    const key = await getKey();
    const valid = await crypto.subtle.verify(
      'HMAC',
      key,
      b64urlToBytes(sig),
      new TextEncoder().encode(`${header}.${body}`),
    );
    if (!valid) return null;
    const payload = JSON.parse(b64urlDecode(body)) as JwtPayload & { exp?: number };
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null;
    return { userId: payload.userId, username: payload.username, name: payload.name };
  } catch {
    return null;
  }
}
