import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
process.env.CCAR_DB = ':memory:';
import { sqliteRepo as repo } from '@/core/repo-sqlite';
import { googleLogin as login, verifyPassword } from '@/core/auth';
const googleLogin = (email: string, invite?: string) => login(email, invite, repo);

describe('google login policy', () => {
  const tag = `g${Date.now()}`;
  beforeEach(() => { process.env.INVITE_CODE = 'sesame'; });
  afterEach(() => { delete process.env.INVITE_CODE; });
  it('new account needs the invite code', async () => {
    expect(await googleLogin(`${tag}@x.com`)).toEqual({ error: 'invite_required' });
    expect(await googleLogin(`${tag}@x.com`, 'nope')).toEqual({ error: 'invalid_invite' });
    expect(await repo.findUser(`${tag}@x.com`)).toBeNull();
    const ok = await googleLogin(`${tag}@x.com`, 'sesame');
    expect('id' in ok).toBe(true);
  });
  it('existing account signs in without a code; case-insensitive', async () => {
    const first = await googleLogin(`${tag}@x.com`) as { id: string };
    expect(first.id).toBeTruthy();
    expect(await googleLogin(`${tag.toUpperCase()}@X.COM`)).toEqual(first);
  });
  it('google-created accounts cannot be opened with a password', async () => {
    const row = (await repo.findUser(`${tag}@x.com`))!;
    for (const pw of ['google', '', 'x$y$z']) expect(verifyPassword(pw, row.pw_hash)).toBe(false);
  });
  it('open when no invite code is configured', async () => {
    delete process.env.INVITE_CODE;
    expect('id' in (await googleLogin(`${tag}-open@x.com`))).toBe(true);
  });
});
