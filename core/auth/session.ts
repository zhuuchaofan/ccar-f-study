import crypto from 'crypto';
import { cookies } from 'next/headers';
import { repo } from '../repo';

const COOKIE = 'ccar_session';
const TTL = 30 * 24 * 3600 * 1000;
const sha = (s: string) => crypto.createHash('sha256').update(s).digest('hex');

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
