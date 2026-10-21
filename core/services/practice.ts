import { explanations, getQuestion, getQuestions, getTaskStatement, publicQuestion } from '../content';
import { isCorrect, normalizeSelection } from '../grading';
import { fail } from '../http';
import { buildQueue, type QueueParams } from '../queue';
import { repo } from '../repo';
import { withMastery } from '../srs';

export function questionFor(num: number) {
  const q = getQuestion(num) ?? fail(404, 'not_found');
  return publicQuestion(q); // never includes answer/explanation
}
/** Record one practice answer and return the verdict with explanations. */
export async function submitAttempt(userId: string, a: { num: number; selected: string[]; ms?: number | null; mode?: string }) {
  const q = getQuestion(a.num) ?? fail(404, 'not_found');
  const sel = normalizeSelection(q, a.selected);
  if (sel.length !== new Set(a.selected).size) fail(400, 'invalid_option');
  const correct = isCorrect(q, sel);
  const progress = await repo.recordAttempt(userId, q.num, sel, correct, a.ms ?? null, a.mode ?? null);
  return {
    correct, answer: q.answer, explanation_en: q.explanation_en, i18n: explanations(q),
    task_statement: q.task_statement ? { id: q.task_statement, title_zh: getTaskStatement(q.task_statement)?.title_zh ?? '' } : null,
    source: { type: q.source_type, name: q.source_name, pdf_pages: q.pdf_pages, review_status: q.review_status },
    progress: withMastery(progress),
  };
}
export async function practiceQueue(userId: string, p: QueueParams) {
  const [progress, bookmarks] = await Promise.all([repo.getProgress(userId), repo.getBookmarks(userId)]);
  return buildQueue(p, { questions: getQuestions(), progress: new Map(progress.map((x) => [x.question_num, x])), bookmarks: new Set(bookmarks), now: Date.now() });
}
/** Everything the dashboard and stats pages need. */
export async function studySummary(userId: string) {
  const [progress, attempts, lessons] = await Promise.all([repo.getProgress(userId), repo.getAttempts(userId, 2000), repo.getLessonStatus(userId)]);
  return { progress: progress.map(withMastery), attempts, lessons, now: Date.now() };
}
