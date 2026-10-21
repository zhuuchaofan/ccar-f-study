import { getDb } from './db';
import { applyAttempt, emptyProgress, isDue, mastery, type Progress } from './srs';

export type AttemptRow = { question_num: number; selected: string[]; is_correct: boolean; created_at: number; mode: string | null };
export type ProgressRow = Progress & { question_num: number };

/** Storage contract. SQLite implementation below; a Firestore implementation can replace it for production. */
export interface Repo {
  recordAttempt(userId: number, num: number, selected: string[], isCorrect: boolean, ms: number | null, mode: string | null, now?: number): Progress;
  getProgress(userId: number): ProgressRow[];
  getAttempts(userId: number, limit?: number): AttemptRow[];
  getBookmarks(userId: number): number[];
  setBookmark(userId: number, num: number, on: boolean): void;
  getLessonStatus(userId: number): Record<string, string>;
  setLessonStatus(userId: number, tsId: string, status: string): void;
}

export const repo: Repo = {
  recordAttempt(userId, num, selected, isCorrect, ms, mode, now = Date.now()) {
    const db = getDb();
    const tx = db.transaction(() => {
      db.prepare('INSERT INTO attempts(user_id,question_num,selected,is_correct,ms,mode,created_at) VALUES(?,?,?,?,?,?,?)')
        .run(userId, num, JSON.stringify(selected), isCorrect ? 1 : 0, ms, mode, now);
      const row = db.prepare('SELECT attempts,correct,streak_wrong,box,last_at,due_at FROM progress WHERE user_id=? AND question_num=?').get(userId, num) as Progress | undefined;
      const next = applyAttempt(row ?? emptyProgress(), isCorrect, now);
      db.prepare(`INSERT INTO progress(user_id,question_num,attempts,correct,streak_wrong,box,last_at,due_at) VALUES(?,?,?,?,?,?,?,?)
        ON CONFLICT(user_id,question_num) DO UPDATE SET attempts=excluded.attempts,correct=excluded.correct,streak_wrong=excluded.streak_wrong,box=excluded.box,last_at=excluded.last_at,due_at=excluded.due_at`)
        .run(userId, num, next.attempts, next.correct, next.streak_wrong, next.box, next.last_at, next.due_at);
      return next;
    });
    return tx();
  },
  getProgress(userId) {
    return getDb().prepare('SELECT question_num,attempts,correct,streak_wrong,box,last_at,due_at FROM progress WHERE user_id=?').all(userId) as ProgressRow[];
  },
  getAttempts(userId, limit = 500) {
    const rows = getDb().prepare('SELECT question_num,selected,is_correct,created_at,mode FROM attempts WHERE user_id=? ORDER BY created_at DESC LIMIT ?').all(userId, limit) as any[];
    return rows.map((r) => ({ ...r, selected: JSON.parse(r.selected), is_correct: !!r.is_correct }));
  },
  getBookmarks(userId) {
    return (getDb().prepare('SELECT question_num FROM bookmarks WHERE user_id=? ORDER BY created_at').all(userId) as any[]).map((r) => r.question_num);
  },
  setBookmark(userId, num, on) {
    const db = getDb();
    if (on) db.prepare('INSERT OR IGNORE INTO bookmarks(user_id,question_num,created_at) VALUES(?,?,?)').run(userId, num, Date.now());
    else db.prepare('DELETE FROM bookmarks WHERE user_id=? AND question_num=?').run(userId, num);
  },
  getLessonStatus(userId) {
    const rows = getDb().prepare('SELECT ts_id,status FROM lesson_progress WHERE user_id=?').all(userId) as any[];
    return Object.fromEntries(rows.map((r) => [r.ts_id, r.status]));
  },
  setLessonStatus(userId, tsId, status) {
    getDb().prepare(`INSERT INTO lesson_progress(user_id,ts_id,status,updated_at) VALUES(?,?,?,?)
      ON CONFLICT(user_id,ts_id) DO UPDATE SET status=excluded.status,updated_at=excluded.updated_at`).run(userId, tsId, status, Date.now());
  },
};

export { isDue, mastery };
