import { DUPLICATE_PAIRS, domainOf, type Question } from './content';
import { isDue, type Progress } from './srs';

export const QUEUE_MODES = ['seq', 'random', 'mistakes', 'bookmarks', 'due', 'unanswered'] as const;
export type QueueMode = (typeof QUEUE_MODES)[number];
export type QueueParams = { mode: QueueMode; domain?: number; ts?: string | null; dedupe?: boolean; start?: number; num?: number; limit?: number };
type Ctx = { questions: Question[]; progress: Map<number, Progress>; bookmarks: Set<number>; now: number; rnd?: () => number };

const shuffle = <T,>(a: T[], rnd: () => number) => { const r = [...a]; for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [r[i], r[j]] = [r[j], r[i]]; } return r; };

/** Question numbers for a practice session. Pure: all user state is passed in. */
export function buildQueue(p: QueueParams, { questions, progress, bookmarks, now, rnd = Math.random }: Ctx): number[] {
  let qs = questions;
  if (p.domain) qs = qs.filter((q) => domainOf(q) === p.domain);
  if (p.ts) qs = qs.filter((q) => q.task_statement === p.ts);
  if (p.dedupe) { const drop = new Set(DUPLICATE_PAIRS.map((d) => Math.max(...d))); qs = qs.filter((q) => !drop.has(q.num)); }
  let nums = qs.map((q) => q.num);
  switch (p.mode) {
    case 'random': nums = shuffle(nums, rnd); break;
    case 'mistakes': nums = nums.filter((n) => (progress.get(n)?.streak_wrong ?? 0) > 0); break;
    case 'bookmarks': nums = nums.filter((n) => bookmarks.has(n)); break;
    case 'due': nums = nums.filter((n) => { const x = progress.get(n); return !!x && isDue(x, now); }); break;
    case 'unanswered': nums = nums.filter((n) => !progress.has(n)); break;
    case 'seq': break;
  }
  // seq + start: rotate so the session resumes at `start` and wraps around
  if (p.mode === 'seq' && p.start) { const i = nums.findIndex((n) => n >= p.start!); if (i > 0) nums = [...nums.slice(i), ...nums.slice(0, i)]; }
  if (p.num) nums = nums.filter((n) => n === p.num);
  if (p.limit) nums = nums.slice(0, p.limit);
  return nums;
}
