import { explanations, getQuestion, getQuestions, publicQuestion } from '../content';
import { EXAM_MINUTES, grade, pickExam, type Answers } from '../exam';
import { fail } from '../http';
import { repo, type ExamRow } from '../repo';

const summary = (e: ExamRow) => ({ id: e.id, started_at: e.started_at, submitted_at: e.submitted_at, total: e.nums.length, correct: e.result?.correct ?? null, by_domain: e.result?.by_domain ?? null });
const view = (e: ExamRow) => ({
  id: e.id, started_at: e.started_at, submitted_at: e.submitted_at, deadline: e.started_at + EXAM_MINUTES * 60000, now: Date.now(),
  questions: e.nums.map((n) => publicQuestion(getQuestion(n)!)),
  // answers and explanations only after submission
  result: e.result && { ...e.result, explanations: Object.fromEntries(e.nums.map((n) => { const q = getQuestion(n)!; return [n, { en: q.explanation_en, ...explanations(q) }]; })) },
});

export async function listExams(userId: string) { return { exams: (await repo.listExams(userId)).map(summary), minutes: EXAM_MINUTES }; }
/** Start a new exam, or resume the unfinished one if it is still within its time limit. */
export async function startExam(userId: string) {
  const open = (await repo.listExams(userId)).find((e) => !e.submitted_at && Date.now() - e.started_at < EXAM_MINUTES * 60000);
  if (open) return { id: open.id, resumed: true };
  return { id: await repo.createExam(userId, pickExam(getQuestions())), resumed: false };
}
export async function getExam(userId: string, id: string) { return view((await repo.getExam(userId, id)) ?? fail(404, 'not_found')); }
export async function submitExam(userId: string, id: string, answers: Answers) {
  const e = (await repo.getExam(userId, id)) ?? fail(404, 'not_found');
  if (e.submitted_at) fail(409, 'already_submitted');
  const result = grade(e.nums, answers);
  if (!(await repo.submitExam(userId, id, result))) fail(409, 'already_submitted');
  // answered questions also feed spaced repetition; unanswered ones are not counted as attempts
  for (const it of result.items) if (it.selected.length) await repo.recordAttempt(userId, it.num, it.selected, it.correct, null, 'exam');
  return view((await repo.getExam(userId, id))!);
}
