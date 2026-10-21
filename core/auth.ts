import crypto from 'crypto';
import { cookies } from 'next/headers';
import { getDb } from './db';

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
export function createUser(email: string, pw: string): number | null {
  const db = getDb();
  try {
    return Number(db.prepare('INSERT INTO users(email,pw_hash,created_at) VALUES(?,?,?)').run(email.toLowerCase(), hashPassword(pw), Date.now()).lastInsertRowid);
  } catch { return null; }
}
export function checkLogin(email: string, pw: string): number | null {
  const row = getDb().prepare('SELECT id,pw_hash FROM users WHERE email=?').get(email.toLowerCase()) as { id: number; pw_hash: string } | undefined;
  // constant-ish work even if the user does not exist
  const ok = verifyPassword(pw, row?.pw_hash ?? hashPassword('dummy'));
  return row && ok ? row.id : null;
}
export async function startSession(userId: number) {
  const token = crypto.randomBytes(32).toString('base64url');
  getDb().prepare('INSERT INTO sessions(token_hash,user_id,expires_at) VALUES(?,?,?)').run(sha(token), userId, Date.now() + TTL);
  (await cookies()).set(COOKIE, token, { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/', maxAge: TTL / 1000 });
}
export async function endSession() {
  const c = await cookies(); const t = c.get(COOKIE)?.value;
  if (t) getDb().prepare('DELETE FROM sessions WHERE token_hash=?').run(sha(t));
  c.delete(COOKIE);
}
export async function currentUser(): Promise<{ id: number; email: string } | null> {
  const t = (await cookies()).get(COOKIE)?.value;
  if (!t) return null;
  const row = getDb().prepare('SELECT u.id,u.email FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=? AND s.expires_at>?').get(sha(t), Date.now()) as any;
  return row ?? null;
}
// Minimal in-memory login throttle (per email+process). Replace with a shared store in production.
const fails = new Map<string, { n: number; until: number }>();
export function throttled(key: string) { const f = fails.get(key); return !!f && f.until > Date.now(); }
export function noteFailure(key: string) { const f = fails.get(key) ?? { n: 0, until: 0 }; f.n++; if (f.n >= 5) { f.until = Date.now() + 60_000; f.n = 0; } fails.set(key, f); }
export function clearFailures(key: string) { fails.delete(key); }
