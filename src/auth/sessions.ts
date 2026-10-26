import { createHmac, timingSafeEqual } from 'node:crypto';

interface SessionPayload {
  sub: number;
  exp: number;
}

function sign(data: string, secret: string): string {
  return createHmac('sha256', secret).update(data).digest('base64url');
}

export function createSessionToken(userId: number, secret: string, ttlSeconds: number, now = Date.now()): string {
  const payload: SessionPayload = { sub: userId, exp: Math.floor(now / 1000) + ttlSeconds };
  const data = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `${data}.${sign(data, secret)}`;
}

/** the user id in a valid, unexpired token, or undefined */
export function verifySessionToken(token: string, secret: string, now = Date.now()): number | undefined {
  const [data, signature] = token.split('.');
  if (!data || !signature) {
    return undefined;
  }
  const expected = Buffer.from(sign(data, secret));
  const actual = Buffer.from(signature);
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) {
    return undefined;
  }
  const payload = JSON.parse(Buffer.from(data, 'base64url').toString()) as SessionPayload;
  if (payload.exp <= Math.floor(now / 1000)) {
    return undefined;
  }
  return payload.sub;
}
