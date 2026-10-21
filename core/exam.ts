import { getDb } from './db';
import { DOMAIN_WEIGHTS, DUPLICATE_PAIRS, domainOf, getQuestion, type Question } from './content';

export const EXAM_SIZE = 60;
export const EXAM_MINUTES = 120;
/** Questions per domain, proportional to the official weights (27/18/20/20/15 → 16/11/12/12/9). */
export const examBlueprint = (size = EXAM_SIZE): Record<number, number> => {
  const raw = Object.entries(DOMAIN_WEIGHTS).map(([d, w]) => ({ d: Number(d), x: (size * w) / 100 }));
  const out = Object.fromEntries(raw.map((r) => [r.d, Math.floor(r.x)]));
  let left = size - Object.values(out).reduce((a, b) => a + b, 0);
  for (const r of [...raw].sort((a, b) => (b.x % 1) - (a.x % 1))) { if (left-- <= 0) break; out[r.d]++; }
  return out;
};

/** Random exam drawn per the blueprint; never contains both questions of a known duplicate pair. */
export function pickExam(questions: Question[], rnd: () => number = Math.random, size = EXAM_SIZE): number[] {
  const drop = new Set(DUPLICATE_PAIRS.map((p) => p[rnd() < 0.5 ? 0 : 1]));
  const pool = questions.filter((q) => !drop.has(q.num));
  const bp = examBlueprint(size);
  const picked: number[] = [];
  for (const [d, n] of Object.entries(bp)) {
    const ds = pool.filter((q) => domainOf(q) === Number(d)).map((q) => q.num);
    for (let i = ds.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [ds[i], ds[j]] = [ds[j], ds[i]]; }
    picked.push(...ds.slice(0, n));
  }
  for (let i = picked.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [picked[i], picked[j]] = [picked[j], picked[i]]; }
  return picked;
}

export type Answers = Record<string, string[]>;
export type ExamResult = { correct: number; total: number; by_domain: Record<number, { correct: number; total: number }>; items: { num: number; selected: string[]; answer: string[]; correct: boolean; domain: number }[] };

export function grade(nums: number[], answers: Answers): ExamResult {
  const by_domain: ExamResult['by_domain'] = {};
  const items = nums.map((num) => {
    const q = getQuestion(num)!; const domain = domainOf(q);
    const selected = [...new Set(answers[String(num)] ?? [])].filter((l) => q.options.some((o) => o.label === l)).sort();
    const ans = [...q.answer].sort();
    const correct = selected.length === ans.length && selected.every((l, i) => l === ans[i]);
    (by_domain[domain] ??= { correct: 0, total: 0 }); by_domain[domain].total++; if (correct) by_domain[domain].correct++;
    return { num, selected, answer: q.answer, correct, domain };
  });
  return { correct: items.filter((i) => i.correct).length, total: items.length, by_domain, items };
}

export type ExamRow = { id: number; nums: number[]; started_at: number; submitted_at: number | null; result: ExamResult | null };
const row = (r: any): ExamRow => ({ id: r.id, nums: JSON.parse(r.nums), started_at: r.started_at, submitted_at: r.submitted_at, result: r.result ? JSON.parse(r.result) : null });

export const exams = {
  create(userId: number, nums: number[], now = Date.now()): number {
    return Number(getDb().prepare('INSERT INTO exams(user_id,nums,started_at) VALUES(?,?,?)').run(userId, JSON.stringify(nums), now).lastInsertRowid);
  },
  get(userId: number, id: number): ExamRow | null {
    const r = getDb().prepare('SELECT * FROM exams WHERE id=? AND user_id=?').get(id, userId); return r ? row(r) : null;
  },
  list(userId: number): ExamRow[] { return (getDb().prepare('SELECT * FROM exams WHERE user_id=? ORDER BY started_at DESC LIMIT 50').all(userId) as any[]).map(row); },
  /** Stores the result once; returns false if the exam was already submitted. */
  submit(userId: number, id: number, result: ExamResult, now = Date.now()): boolean {
    return getDb().prepare('UPDATE exams SET submitted_at=?, result=? WHERE id=? AND user_id=? AND submitted_at IS NULL').run(now, JSON.stringify(result), id, userId).changes === 1;
  },
};
