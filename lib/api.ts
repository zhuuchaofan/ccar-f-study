// Typed fetch helpers for client components. Response types come from the server services (type-only imports, erased at build).
import type { questionFor, submitAttempt, StudySummary } from '@/core/services/practice';
import type { getExam, listExams, startExam } from '@/core/services/exam';

type R<F extends (...a: any[]) => any> = Awaited<ReturnType<F>>;
export type PublicQuestion = R<typeof questionFor>;
export type AttemptResult = R<typeof submitAttempt>;
export type ExamView = R<typeof getExam>;
export type ExamList = R<typeof listExams>;
export type { StudySummary };

/** Mirrors the server's error body: { error: code, message }. */
export class ApiFailure extends Error {
  constructor(public status: number, public code: string, message: string) { super(message); }
}
export async function api<T>(path: string, body?: unknown): Promise<T> {
  const r = await fetch(path, body === undefined ? undefined : { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new ApiFailure(r.status, d.error ?? 'error', d.message ?? d.error ?? '请求失败');
  return d as T;
}
export const isAnon = (e: unknown) => e instanceof ApiFailure && e.status === 401;

export const getStudy = () => api<StudySummary>('/api/progress');
export const getQuestion = (num: number) => api<PublicQuestion>(`/api/questions/${num}`);
export const getQueue = (qs: string) => api<{ mode: string; domain: number | null; nums: number[] }>(`/api/practice/queue?${qs}`);
export const postAttempt = (b: { num: number; selected: string[]; ms: number; mode: string }) => api<AttemptResult>('/api/attempts', b);
export const getBookmarks = () => api<{ nums: number[] }>('/api/bookmarks');
export const setBookmark = (num: number, on: boolean) => api<{ ok: true }>('/api/bookmarks', { num, on });
export const setLesson = (ts: string, status: string) => api<{ ok: true }>('/api/lessons', { ts, status });
export const listExamsApi = () => api<ExamList>('/api/exam');
export const startExamApi = () => api<R<typeof startExam>>('/api/exam', {});
export const getExamApi = (id: string) => api<ExamView>(`/api/exam/${id}`);
export const submitExamApi = (id: string, answers: Record<string, string[]>) => api<ExamView>(`/api/exam/${id}`, { answers });
