import { getQuestions } from '@/core/content';
import { pickExam, EXAM_MINUTES } from '@/core/exam';
import { repo, type ExamRow } from '@/core/repo';
import { json, isJson, requireUser } from '@/core/http';
const summary = (e: ExamRow) => ({ id: e.id, started_at: e.started_at, submitted_at: e.submitted_at, total: e.nums.length, correct: e.result?.correct ?? null, by_domain: e.result?.by_domain ?? null });
export async function GET() {
  const u = await requireUser(); if (!u) return json({ error: 'unauthorized' }, 401);
  return json({ exams: (await repo.listExams(u.id)).map(summary), minutes: EXAM_MINUTES });
}
/** Start a new exam, or resume the unfinished one if it is still within its time limit. */
export async function POST(req: Request) {
  const u = await requireUser(); if (!u) return json({ error: 'unauthorized' }, 401);
  if (!isJson(req)) return json({ error: 'bad_request' }, 400);
  const open = (await repo.listExams(u.id)).find((e) => !e.submitted_at && Date.now() - e.started_at < EXAM_MINUTES * 60000);
  if (open) return json({ id: open.id, resumed: true });
  return json({ id: await repo.createExam(u.id, pickExam(getQuestions())), resumed: false });
}
