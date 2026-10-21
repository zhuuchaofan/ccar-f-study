import { describe, it, expect, beforeAll } from 'vitest';
process.env.CCAR_DB = ':memory:';
import { hashPassword, verifyPassword } from '@/core/auth';
import type { Repo } from '@/core/repo';
import { sqliteRepo } from '@/core/repo-sqlite';
import { grade } from '@/core/exam';
import { getQuestion } from '@/core/content';

describe('passwords', () => {
  it('hashes and verifies', () => { const h = hashPassword('correct horse'); expect(verifyPassword('correct horse', h)).toBe(true); expect(verifyPassword('wrong', h)).toBe(false); expect(h).not.toContain('correct'); });
});

/** One contract, run against every storage backend. Firestore runs only when FIRESTORE_EMULATOR_HOST is set. */
const backends: [string, () => Promise<Repo>][] = [['sqlite', async () => sqliteRepo]];
if (process.env.FIRESTORE_EMULATOR_HOST) backends.push(['firestore', async () => (await import('@/core/repo-firestore')).firestoreRepo]);

for (const [name, load] of backends) describe(`repo contract: ${name}`, () => {
  let repo: Repo; let uid = '', other = '';
  const tag = `${name}${Date.now()}${Math.floor(Math.random() * 1e6)}`;
  beforeAll(async () => {
    repo = await load();
    uid = (await repo.createUser(`a-${tag}@x.com`, hashPassword('password1')))!; other = (await repo.createUser(`b-${tag}@x.com`, hashPassword('password1')))!;
  });
  it('users: unique email, lookup', async () => {
    expect(uid).toBeTruthy(); expect(await repo.createUser(`a-${tag}@x.com`, 'h')).toBeNull();
    expect((await repo.findUser(`a-${tag}@x.com`))!.id).toBe(uid); expect(await repo.findUser(`zz-${tag}@x.com`)).toBeNull();
  });
  it('sessions: create, expire, delete', async () => {
    await repo.createSession(`t1-${tag}`, uid, 5000);
    expect(await repo.sessionUser(`t1-${tag}`, 1000)).toEqual({ id: uid, email: `a-${tag}@x.com` });
    expect(await repo.sessionUser(`t1-${tag}`, 6000)).toBeNull();
    expect(await repo.sessionUser(`t1-${tag}`, 1000)).toBeNull(); // deleted once seen expired
    await repo.deleteSession(`t1-${tag}`); expect(await repo.sessionUser(`t1-${tag}`, 1000)).toBeNull();
  });
  it('records attempts and keeps per-question progress', async () => {
    await repo.recordAttempt(uid, 5, ['A'], false, 1000, 'seq', 1000);
    await repo.recordAttempt(uid, 5, ['B'], true, 900, 'seq', 2000);
    const p = (await repo.getProgress(uid)).find((x) => x.question_num === 5)!;
    expect(p.attempts).toBe(2); expect(p.correct).toBe(1); expect(p.streak_wrong).toBe(0); expect(p.box).toBe(2);
    expect((await repo.getAttempts(uid)).map((a) => [a.is_correct, a.selected])).toEqual([[true, ['B']], [false, ['A']]]);
    expect((await repo.getAttempts(uid, 10, 1500)).map((a) => a.created_at)).toEqual([2000]);
    expect(await repo.getAttempts(uid, 1)).toHaveLength(1);
  });
  it('isolates users', async () => { expect(await repo.getProgress(other)).toEqual([]); expect(await repo.getAttempts(other)).toEqual([]); expect(await repo.listExams(other)).toEqual([]); });
  it('bookmarks toggle idempotently', async () => {
    await repo.setBookmark(uid, 9, true); await repo.setBookmark(uid, 9, true); expect(await repo.getBookmarks(uid)).toEqual([9]);
    await repo.setBookmark(uid, 9, false); expect(await repo.getBookmarks(uid)).toEqual([]);
  });
  it('lesson status upserts', async () => { await repo.setLessonStatus(uid, '1.1', 'learning'); await repo.setLessonStatus(uid, '1.1', 'done'); expect(await repo.getLessonStatus(uid)).toEqual({ '1.1': 'done' }); });
  it('exams: create, owner-only read, submit once', async () => {
    const id = await repo.createExam(uid, [1, 2, 3], 100);
    expect(await repo.getExam(other, id)).toBeNull();
    const r = grade([1, 2, 3], { '1': getQuestion(1)!.answer });
    expect(await repo.submitExam(uid, id, r, 200)).toBe(true); expect(await repo.submitExam(uid, id, r, 300)).toBe(false);
    const e = (await repo.getExam(uid, id))!; expect(e.nums).toEqual([1, 2, 3]); expect(e.submitted_at).toBe(200); expect(e.result!.correct).toBe(1);
    expect((await repo.listExams(uid)).map((x) => x.id)).toEqual([id]);
  });
});
