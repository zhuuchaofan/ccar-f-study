import { repo } from '../repo';
import { inviteOk, inviteRequired } from './invite';
import { hashPassword, verifyPassword } from './password';

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
/**
 * Sign in with a verified Google email. Existing accounts (same email) sign in directly;
 * a new account needs the invite code. Google-created accounts get a hash that never matches a password.
 */
export async function googleLogin(email: string, invite?: string): Promise<{ id: string } | { error: 'invite_required' | 'invalid_invite' }> {
  const e = email.toLowerCase();
  const row = await repo.findUser(e);
  if (row) return { id: row.id };
  if (inviteRequired() && invite === undefined) return { error: 'invite_required' };
  if (!inviteOk(invite)) return { error: 'invalid_invite' };
  const id = await repo.createUser(e, 'google', Date.now()) ?? (await repo.findUser(e))?.id;
  return id ? { id } : { error: 'invalid_invite' };
}
