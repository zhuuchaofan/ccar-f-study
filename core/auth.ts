import crypto from 'crypto';
import { cookies } from 'next/headers';
import { repo } from './repo';

const COOKIE = 'ccar_session';
const TTL = 30 * 24 * 3600 * 1000;
const sha = (s: string) => crypto.createHash('sha256').update(s).digest('hex');

export function hashPassword(pw: string): string {
  const salt = crypto.randomBytes(16);
  const key = crypto.scryptSync(pw, salt, 64);
  return `scrypt$${salt.toString('hex')}$${key.toString('hex')}`;
}
export function verifyPassword(pw: string, stored: string): boolean {
  const [alg, saltHex, keyHex] = stored.split('$');
  if (alg !== 'scrypt') return false;
  const key = crypto.scryptSync(pw, Buffer.from(saltHex, 'hex'), 64);
  const expected = Buffer.from(keyHex, 'hex');
  return key.length === expected.length && crypto.timingSafeEqual(key, expected);
}
export async function createUser(email: string, pw: string): Promise<string | null> {
  return repo.createUser(email.toLowerCase(), hashPassword(pw), Date.now());
}
const DUMMY = hashPassword('dummy');
export async function checkLogin(email: string, pw: string): Promise<string | null> {
  const row = await repo.findUser(email.toLowerCase());
  // same work whether or not the user exists
  const ok = verifyPassword(pw, row?.pw_hash ?? DUMMY);
  return row && ok ? row.id : null;
}
/** Registration needs INVITE_CODE when it is set (production); open when unset (local dev). */
export function inviteOk(code: string | undefined) {
  const want = process.env.INVITE_CODE;
  if (!want) return true;
  const a = Buffer.from(sha(code ?? '')), b = Buffer.from(sha(want));
  return crypto.timingSafeEqual(a, b);
}
export const inviteRequired = () => !!process.env.INVITE_CODE;
export async function startSession(userId: string) {
  const token = crypto.randomBytes(32).toString('base64url');
  await repo.createSession(sha(token), userId, Date.now() + TTL);
  (await cookies()).set(COOKIE, token, { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/', maxAge: TTL / 1000 });
}
export async function endSession() {
  const c = await cookies(); const t = c.get(COOKIE)?.value;
  if (t) await repo.deleteSession(sha(t));
  c.delete(COOKIE);
}
export async function currentUser(): Promise<{ id: string; email: string } | null> {
  const t = (await cookies()).get(COOKIE)?.value;
  if (!t) return null;
  return repo.sessionUser(sha(t), Date.now());
}
// Minimal in-memory login throttle (per email+process). Replace with a shared store in production.
const fails = new Map<string, { n: number; until: number }>();
export function throttled(key: string) { const f = fails.get(key); return !!f && f.until > Date.now(); }
export function noteFailure(key: string) { const f = fails.get(key) ?? { n: 0, until: 0 }; f.n++; if (f.n >= 5) { f.until = Date.now() + 60_000; f.n = 0; } fails.set(key, f); }
export function clearFailures(key: string) { fails.delete(key); }
