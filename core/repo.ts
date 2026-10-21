import { applyAttempt, emptyProgress, isDue, mastery, type Progress } from './srs';
import type { ExamResult } from './exam';

export type AttemptRow = { question_num: number; selected: string[]; is_correct: boolean; created_at: number; mode: string | null };
export type ProgressRow = Progress & { question_num: number };
export type ExamRow = { id: string; nums: number[]; started_at: number; submitted_at: number | null; result: ExamResult | null };
export type SessionUser = { id: string; email: string };

/** Storage contract. SQLite (local dev, tests) and Firestore (Cloud Run) implement it; pick with STORAGE=sqlite|firestore. */
export interface Repo {
  createUser(email: string, pwHash: string, now?: number): Promise<string | null>;
  findUser(email: string): Promise<{ id: string; pw_hash: string } | null>;
  createSession(tokenHash: string, userId: string, expiresAt: number): Promise<void>;
  deleteSession(tokenHash: string): Promise<void>;
  sessionUser(tokenHash: string, now: number): Promise<SessionUser | null>;
  recordAttempt(userId: string, num: number, selected: string[], isCorrect: boolean, ms: number | null, mode: string | null, now?: number): Promise<Progress>;
  getProgress(userId: string): Promise<ProgressRow[]>;
  getAttempts(userId: string, limit?: number): Promise<AttemptRow[]>;
  getBookmarks(userId: string): Promise<number[]>;
  setBookmark(userId: string, num: number, on: boolean): Promise<void>;
  getLessonStatus(userId: string): Promise<Record<string, string>>;
  setLessonStatus(userId: string, tsId: string, status: string): Promise<void>;
  createExam(userId: string, nums: number[], now?: number): Promise<string>;
  getExam(userId: string, id: string): Promise<ExamRow | null>;
  listExams(userId: string): Promise<ExamRow[]>;
  /** Stores the result once; resolves false if the exam was already submitted. */
  submitExam(userId: string, id: string, result: ExamResult, now?: number): Promise<boolean>;
}

/** Shared by both implementations so progress math stays identical. */
export const nextProgress = (prev: Progress | undefined, isCorrect: boolean, now: number) => applyAttempt(prev ?? emptyProgress(), isCorrect, now);

let impl: Repo | null = null;
function getRepo(): Repo {
  if (impl) return impl;
  if ((process.env.STORAGE || 'sqlite') === 'firestore') impl = require('./repo-firestore').firestoreRepo as Repo;
  else impl = require('./repo-sqlite').sqliteRepo as Repo;
  return impl;
}
/** Lazily bound so the Firestore client is only loaded when it is configured. */
export const repo: Repo = new Proxy({} as Repo, { get: (_, k) => (getRepo() as any)[k] });

export { isDue, mastery };
