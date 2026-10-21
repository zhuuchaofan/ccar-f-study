import { z } from 'zod';
import { explanations, getQuestion, publicQuestion } from '@/core/content';
import { exams, grade, EXAM_MINUTES } from '@/core/exam';
import { json, isJson, requireUser } from '@/core/http';
import { repo } from '@/core/repo';
const payload = (e: NonNullable<ReturnType<typeof exams.get>>) => ({
  id: e.id, started_at: e.started_at, submitted_at: e.submitted_at, deadline: e.started_at + EXAM_MINUTES * 60000, now: Date.now(),
  questions: e.nums.map((n) => publicQuestion(getQuestion(n)!)),
  // answers and explanations only after submission
  result: e.result && { ...e.result, explanations: Object.fromEntries(e.nums.map((n) => { const q = getQuestion(n)!; return [n, { en: q.explanation_en, ...explanations(q) }]; })) },
});
export async function GET(_: Request, ctx: { params: Promise<{ id: string }> }) {
  const u = await requireUser(); if (!u) return json({ error: 'unauthorized' }, 401);
  const e = exams.get(u.id, Number((await ctx.params).id)); if (!e) return json({ error: 'not_found' }, 404);
  return json(payload(e));
}
const Body = z.object({ answers: z.record(z.string(), z.array(z.string().length(1)).max(6)) });
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const u = await requireUser(); if (!u) return json({ error: 'unauthorized' }, 401);
  if (!isJson(req)) return json({ error: 'bad_request' }, 400);
  const id = Number((await ctx.params).id);
  const e = exams.get(u.id, id); if (!e) return json({ error: 'not_found' }, 404);
  if (e.submitted_at) return json({ error: 'already_submitted' }, 409);
  const p = Body.safeParse(await req.json().catch(() => null)); if (!p.success) return json({ error: 'invalid' }, 400);
  const result = grade(e.nums, p.data.answers);
  if (!exams.submit(u.id, id, result)) return json({ error: 'already_submitted' }, 409);
  // answered questions also feed spaced repetition; unanswered ones are not counted as attempts
  for (const it of result.items) if (it.selected.length) repo.recordAttempt(u.id, it.num, it.selected, it.correct, null, 'exam');
  return json(payload(exams.get(u.id, id)!));
}
