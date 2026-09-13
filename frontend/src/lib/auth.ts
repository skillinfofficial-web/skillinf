import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

const SECRET  = process.env.JWT_SECRET || 'skillinf_dev_secret_change_in_prod';
export const COOKIE_NAME = 'skillinf_token';
export const MAX_AGE     = 7 * 24 * 60 * 60; // 7 days in seconds

export interface TokenPayload {
  userId: string;
  email:  string;
  name:   string;
  iat?:   number;
  exp?:   number;
}

export function signToken(payload: Omit<TokenPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, SECRET, { expiresIn: MAX_AGE });
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, SECRET) as TokenPayload;
  } catch {
    return null;
  }
}

/** Read + verify the auth cookie from the incoming request context. */
export async function getAuthUser(): Promise<TokenPayload | null> {
  try {
    const store  = await cookies();
    const cookie = store.get(COOKIE_NAME);
    if (!cookie?.value) return null;
    return verifyToken(cookie.value);
  } catch {
    return null;
  }
}

/** Attach an HTTP-only auth cookie to any NextResponse. */
export function setAuthCookie(res: NextResponse, token: string): void {
  res.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure:   process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge:   MAX_AGE,
    path:     '/',
  });
}

/** Clear the auth cookie on a NextResponse. */
export function clearAuthCookie(res: NextResponse): void {
  res.cookies.set(COOKIE_NAME, '', {
    httpOnly: true,
    secure:   process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge:   0,
    path:     '/',
  });
}
