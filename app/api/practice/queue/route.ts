import { getQuestions, domainOf, DUPLICATE_PAIRS } from '@/core/content';
import { json, requireUser } from '@/core/http';
import { repo } from '@/core/repo';
import { isDue } from '@/core/srs';
const shuffle = <T,>(a: T[]) => { const r = [...a]; for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [r[i], r[j]] = [r[j], r[i]]; } return r; };
export async function GET(req: Request) {
  const u = await requireUser(); if (!u) return json({ error: 'unauthorized' }, 401);
  const url = new URL(req.url);
  const mode = url.searchParams.get('mode') || 'seq';
  const domain = Number(url.searchParams.get('domain') || 0);
  const noDup = url.searchParams.get('dedupe') === '1';
  const prog = new Map(repo.getProgress(u.id).map((p) => [p.question_num, p]));
  const marks = new Set(repo.getBookmarks(u.id));
  const now = Date.now();
  let qs = getQuestions();
  if (domain) qs = qs.filter((q) => domainOf(q) === domain);
  const ts = url.searchParams.get('ts');
  if (ts) qs = qs.filter((q) => q.task_statement === ts);
  if (noDup) { const drop = new Set(DUPLICATE_PAIRS.map((p) => Math.max(...p))); qs = qs.filter((q) => !drop.has(q.num)); }
  let nums = qs.map((q) => q.num);
  switch (mode) {
    case 'random': nums = shuffle(nums); break;
    case 'mistakes': nums = nums.filter((n) => (prog.get(n)?.streak_wrong ?? 0) > 0); break;
    case 'bookmarks': nums = nums.filter((n) => marks.has(n)); break;
    case 'due': nums = nums.filter((n) => { const p = prog.get(n); return !!p && isDue(p, now); }); break;
    case 'unanswered': nums = nums.filter((n) => !prog.has(n)); break;
    case 'seq': break;
    default: return json({ error: 'invalid_mode' }, 400);
  }
  const start = Number(url.searchParams.get('start') || 0);
  if (mode === 'seq' && start) { const i = nums.findIndex((n) => n >= start); if (i > 0) nums = [...nums.slice(i), ...nums.slice(0, i)]; }
  const one = Number(url.searchParams.get('num') || 0);
  if (one) nums = nums.filter((n) => n === one);
  const limit = Math.min(152, Math.max(0, Number(url.searchParams.get('limit') || 0)));
  if (limit) nums = nums.slice(0, limit);
  return json({ mode, domain: domain || null, nums });
}
