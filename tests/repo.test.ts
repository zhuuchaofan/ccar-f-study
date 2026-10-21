import { describe, it, expect, beforeAll } from 'vitest';
process.env.CCAR_DB = ':memory:';
import { createUser, checkLogin, hashPassword, verifyPassword } from '@/core/auth';
import { repo } from '@/core/repo';
describe('auth', () => {
  it('hashes and verifies passwords', () => { const h = hashPassword('correct horse'); expect(verifyPassword('correct horse', h)).toBe(true); expect(verifyPassword('wrong', h)).toBe(false); expect(h).not.toContain('correct'); });
  it('registers once per email (case-insensitive) and checks login', () => {
    const id = createUser('A@x.com', 'password1'); expect(id).toBeTruthy(); expect(createUser('a@x.com', 'password2')).toBeNull();
    expect(checkLogin('a@X.com', 'password1')).toBe(id); expect(checkLogin('a@x.com', 'nope')).toBeNull(); expect(checkLogin('zz@x.com', 'password1')).toBeNull();
  });
});
describe('repo persistence', () => {
  let uid = 0, other = 0;
  beforeAll(() => { uid = createUser('u1@x.com', 'password1')!; other = createUser('u2@x.com', 'password1')!; });
  it('records attempts and keeps per-question progress', () => {
    repo.recordAttempt(uid, 5, ['A'], false, 1000, 'seq', 1000);
    repo.recordAttempt(uid, 5, ['B'], true, 900, 'seq', 2000);
    const p = repo.getProgress(uid).find((x) => x.question_num === 5)!;
    expect(p.attempts).toBe(2); expect(p.correct).toBe(1); expect(p.streak_wrong).toBe(0); expect(p.box).toBe(2);
    expect(repo.getAttempts(uid).map((a) => a.is_correct)).toEqual([true, false]);
  });
  it('isolates users', () => { expect(repo.getProgress(other)).toEqual([]); expect(repo.getAttempts(other)).toEqual([]); });
  it('bookmarks toggle idempotently', () => { repo.setBookmark(uid, 9, true); repo.setBookmark(uid, 9, true); expect(repo.getBookmarks(uid)).toEqual([9]); repo.setBookmark(uid, 9, false); expect(repo.getBookmarks(uid)).toEqual([]); });
  it('lesson status upserts', () => { repo.setLessonStatus(uid, '1.1', 'learning'); repo.setLessonStatus(uid, '1.1', 'done'); expect(repo.getLessonStatus(uid)).toEqual({ '1.1': 'done' }); });
});
