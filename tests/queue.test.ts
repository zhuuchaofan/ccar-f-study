import { describe, it, expect } from 'vitest';
import { getQuestions, getQuestion, domainOf, DUPLICATE_PAIRS } from '@/core/content';
import { buildQueue } from '@/core/queue';
import { isCorrect, normalizeSelection } from '@/core/grading';
import { applyAttempt, emptyProgress, type Progress } from '@/core/srs';

const questions = getQuestions();
const NOW = 1_000_000_000;
const ctx = (progress: [number, Progress][] = [], bookmarks: number[] = []) => ({ questions, progress: new Map(progress), bookmarks: new Set(bookmarks), now: NOW, rnd: () => 0.42 });
const wrong = (n: number): [number, Progress] => [n, applyAttempt(emptyProgress(), false, NOW - 3600_000)];
const right = (n: number): [number, Progress] => [n, applyAttempt(emptyProgress(), true, NOW)];

describe('practice queue', () => {
  it('seq is every question in order; start rotates and wraps', () => {
    expect(buildQueue({ mode: 'seq' }, ctx())).toEqual(questions.map((q) => q.num));
    const r = buildQueue({ mode: 'seq', start: 150 }, ctx());
    expect(r.slice(0, 4)).toEqual([150, 151, 152, 1]); expect(r).toHaveLength(questions.length);
  });
  it('random is a permutation', () => { const r = buildQueue({ mode: 'random' }, ctx()); expect([...r].sort((a, b) => a - b)).toEqual(questions.map((q) => q.num)); expect(r).not.toEqual(questions.map((q) => q.num)); });
  it('filters by domain, task statement, single number and limit', () => {
    expect(buildQueue({ mode: 'seq', domain: 2 }, ctx()).every((n) => domainOf(getQuestion(n)!) === 2)).toBe(true);
    const ts = questions.find((q) => q.task_statement)!.task_statement!;
    expect(buildQueue({ mode: 'seq', ts }, ctx()).every((n) => getQuestion(n)!.task_statement === ts)).toBe(true);
    expect(buildQueue({ mode: 'seq', num: 7 }, ctx())).toEqual([7]);
    expect(buildQueue({ mode: 'seq', limit: 10 }, ctx())).toHaveLength(10);
  });
  it('dedupe drops the later question of each duplicate pair', () => { const r = buildQueue({ mode: 'seq', dedupe: true }, ctx()); for (const [a, b] of DUPLICATE_PAIRS) { expect(r).toContain(Math.min(a, b)); expect(r).not.toContain(Math.max(a, b)); } });
  it('mistakes, due, unanswered and bookmarks use the passed-in state', () => {
    const c = ctx([wrong(3), right(4)], [9]);
    expect(buildQueue({ mode: 'mistakes' }, c)).toEqual([3]);
    expect(buildQueue({ mode: 'due' }, c)).toEqual([3]);           // wrong answers are due after 10 minutes; the right one is not due yet
    expect(buildQueue({ mode: 'unanswered' }, c)).not.toContain(3); expect(buildQueue({ mode: 'unanswered' }, c)).toHaveLength(questions.length - 2);
    expect(buildQueue({ mode: 'bookmarks' }, c)).toEqual([9]);
  });
});

describe('grading', () => {
  const single = questions.find((q) => q.answer.length === 1)!;
  const multi = questions.find((q) => q.answer.length > 1);
  it('exact match, order and duplicates do not matter, unknown labels ignored', () => {
    expect(isCorrect(single, single.answer)).toBe(true);
    expect(isCorrect(single, [...single.answer, ...single.answer, 'Z'])).toBe(true);
    expect(isCorrect(single, single.options.map((o) => o.label))).toBe(false);
    expect(normalizeSelection(single, ['Z', 'B', 'A', 'B'])).toEqual(['A', 'B']);
    if (multi) { expect(isCorrect(multi, [...multi.answer].reverse())).toBe(true); expect(isCorrect(multi, multi.answer.slice(1))).toBe(false); }
  });
});
