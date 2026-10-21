import type { Progress } from './srs';
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

const METHODS = ['createUser', 'findUser', 'createSession', 'deleteSession', 'sessionUser', 'recordAttempt', 'getProgress', 'getAttempts', 'getBookmarks', 'setBookmark', 'getLessonStatus', 'setLessonStatus', 'createExam', 'getExam', 'listExams', 'submitExam'] as const satisfies readonly (keyof Repo)[];

export type StorageKind = 'sqlite' | 'firestore';
/** Loads one backend. Dynamic imports keep the Firestore client and better-sqlite3 (absent in production) out of the other path. */
export async function createRepo(kind: StorageKind): Promise<Repo> {
  return kind === 'firestore' ? (await import('./repo-firestore')).firestoreRepo : (await import('./repo-sqlite')).sqliteRepo;
}
let current: Promise<Repo> | null = null;
/** The app's repo, chosen once from STORAGE=sqlite|firestore. */
export const getRepo = () => (current ??= createRepo(process.env.STORAGE === 'firestore' ? 'firestore' : 'sqlite'));
/** Tests (or scripts) can swap the backend. */
export const setRepo = (r: Repo) => { current = Promise.resolve(r); };
/** Forwards every call to getRepo(), so modules can import `repo` without knowing which backend is configured. */
export const repo = Object.fromEntries(METHODS.map((k) => [k, async (...args: unknown[]) => ((await getRepo())[k] as (...a: unknown[]) => unknown)(...args)])) as unknown as Repo;

