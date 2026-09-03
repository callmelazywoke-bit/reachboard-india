import { createHmac, randomBytes, timingSafeEqual } from 'crypto';

export const SESSION_COOKIE = 'rb_session';
export const OAUTH_STATE_COOKIE = 'rb_oauth_state';

const SESSION_MAX_AGE = 60 * 60 * 24 * 30;

function getSecret(): string {
  const secret =
    process.env.SESSION_SECRET ||
    process.env.INSTAGRAM_CLIENT_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    '';
  if (!secret) {
    throw new Error('No server secret available for session signing');
  }
  return secret;
}

function base64url(input: Buffer | string): string {
  return Buffer.from(input)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function fromBase64url(input: string): Buffer {
  return Buffer.from(input.replace(/-/g, '+').replace(/_/g, '/'), 'base64');
}

function sign(payload: string): string {
  return base64url(createHmac('sha256', getSecret()).update(payload).digest());
}

export interface SessionPayload {
  creatorId: string;
  username: string;
  exp: number;
}

export function createSessionToken(creatorId: string, username: string): string {
  const payload: SessionPayload = {
    creatorId,
    username,
    exp: Math.floor(Date.now() / 1000) + SESSION_MAX_AGE,
  };
  const body = base64url(JSON.stringify(payload));
  return `${body}.${sign(body)}`;
}

export function verifySessionToken(token: string | undefined | null): SessionPayload | null {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;

  const [body, signature] = parts;
  let expected: Buffer;
  let received: Buffer;
  try {
    expected = fromBase64url(sign(body));
    received = fromBase64url(signature);
  } catch {
    return null;
  }
  if (expected.length !== received.length) return null;
  if (!timingSafeEqual(expected, received)) return null;

  try {
    const payload = JSON.parse(fromBase64url(body).toString('utf8')) as SessionPayload;
    if (!payload || typeof payload.creatorId !== 'string' || typeof payload.username !== 'string') {
      return null;
    }
    if (typeof payload.exp !== 'number' || payload.exp * 1000 < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

export function sessionCookieOptions(maxAge: number = SESSION_MAX_AGE) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge,
  };
}

export function createOAuthState(): string {
  return base64url(randomBytes(24));
}

export function oauthStateMatches(cookieValue: string | undefined | null, queryValue: string | null): boolean {
  if (!cookieValue || !queryValue) return false;
  const a = Buffer.from(cookieValue);
  const b = Buffer.from(queryValue);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
