import { getQuestions } from '@/core/content';
import { exams, pickExam, EXAM_MINUTES } from '@/core/exam';
import { json, isJson, requireUser } from '@/core/http';
const summary = (e: ReturnType<typeof exams.list>[number]) => ({ id: e.id, started_at: e.started_at, submitted_at: e.submitted_at, total: e.nums.length, correct: e.result?.correct ?? null, by_domain: e.result?.by_domain ?? null });
export async function GET() {
  const u = await requireUser(); if (!u) return json({ error: 'unauthorized' }, 401);
  return json({ exams: exams.list(u.id).map(summary), minutes: EXAM_MINUTES });
}
/** Start a new exam, or resume the unfinished one if it is still within its time limit. */
export async function POST(req: Request) {
  const u = await requireUser(); if (!u) return json({ error: 'unauthorized' }, 401);
  if (!isJson(req)) return json({ error: 'bad_request' }, 400);
  const open = exams.list(u.id).find((e) => !e.submitted_at && Date.now() - e.started_at < EXAM_MINUTES * 60000);
  if (open) return json({ id: open.id, resumed: true });
  return json({ id: exams.create(u.id, pickExam(getQuestions())), resumed: false });
}
