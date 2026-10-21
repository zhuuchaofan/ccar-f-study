import { describe, it, expect, beforeAll } from 'vitest';
process.env.CCAR_DB = ':memory:';
import { getQuestions, getQuestion, domainOf, publicQuestion, DUPLICATE_PAIRS } from '@/core/content';
import { examBlueprint, pickExam, grade, exams, EXAM_SIZE } from '@/core/exam';
import { createUser } from '@/core/auth';
const seeded = (s: number) => () => ((s = (s * 1103515245 + 12345) % 2 ** 31) / 2 ** 31);
describe('exam blueprint and sampling', () => {
  it('blueprint follows domain weights and sums to 60', () => { expect(examBlueprint()).toEqual({ 1: 16, 2: 11, 3: 12, 4: 12, 5: 9 }); });
  it('picks 60 unique questions with the right domain mix and no duplicate pair', () => {
    for (let s = 1; s < 30; s++) {
      const nums = pickExam(getQuestions(), seeded(s));
      expect(nums.length).toBe(EXAM_SIZE); expect(new Set(nums).size).toBe(EXAM_SIZE);
      const c: Record<number, number> = {}; nums.forEach((n) => { const d = domainOf(getQuestion(n)!); c[d] = (c[d] ?? 0) + 1; });
      expect(c).toEqual(examBlueprint());
      for (const [a, b] of DUPLICATE_PAIRS) expect(nums.includes(a) && nums.includes(b)).toBe(false);
    }
  });
  it('grades per question and per domain; unanswered counts as wrong; invalid labels ignored', () => {
    const q1 = getQuestion(1)!, q2 = getQuestion(2)!;
    const r = grade([1, 2, 3], { '1': q1.answer, '2': ['Z'] });
    expect(r.correct).toBe(1); expect(r.total).toBe(3); expect(r.items[1].selected).toEqual([]);
    expect(r.by_domain[domainOf(q1)].correct).toBeGreaterThanOrEqual(1); void q2;
  });
});
describe('exam storage', () => {
  let uid = 0, other = 0;
  beforeAll(() => { uid = createUser('ex1@x.com', 'password1')!; other = createUser('ex2@x.com', 'password1')!; });
  it('creates, isolates by user, and submits only once', () => {
    const id = exams.create(uid, [1, 2, 3]);
    expect(exams.get(other, id)).toBeNull();
    const r = grade([1, 2, 3], {});
    expect(exams.submit(uid, id, r)).toBe(true); expect(exams.submit(uid, id, r)).toBe(false);
    expect(exams.get(uid, id)!.result!.total).toBe(3); expect(exams.list(uid).length).toBe(1);
  });
});
describe('translations', () => {
  it('translated questions expose zh/ja stems before answering but never explanations', () => {
    const p = publicQuestion(getQuestion(1)!);
    expect(p.i18n.zh?.stem).toMatch(/CLAUDE|CI\/CD/); expect(Object.keys(p.i18n.ja?.options ?? {})).toEqual(['A', 'B', 'C', 'D']);
    expect(JSON.stringify(p)).not.toMatch(/explanation|takeaway/);
  });
  it('every translated question maps to a task statement', () => { for (const q of getQuestions()) if (q.i18n.zh) expect(q.task_statement).toMatch(/^[1-5]\.[1-7]$/); });
});
