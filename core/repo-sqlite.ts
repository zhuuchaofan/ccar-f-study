import { getDb } from './db';
import type { Repo } from './repo';
import { nextProgress } from './srs';
import type { Progress } from './srs';

const id = (s: string) => Number(s);
export const sqliteRepo: Repo = {
  async createUser(email, pwHash, now = Date.now()) {
    try { return String(getDb().prepare('INSERT INTO users(email,pw_hash,created_at) VALUES(?,?,?)').run(email, pwHash, now).lastInsertRowid); }
    catch { return null; }
  },
  async findUser(email) {
    const r = getDb().prepare('SELECT id,pw_hash FROM users WHERE email=?').get(email) as { id: number; pw_hash: string } | undefined;
    return r ? { id: String(r.id), pw_hash: r.pw_hash } : null;
  },
  async createSession(tokenHash, userId, expiresAt) { getDb().prepare('INSERT INTO sessions(token_hash,user_id,expires_at) VALUES(?,?,?)').run(tokenHash, id(userId), expiresAt); },
  async deleteSession(tokenHash) { getDb().prepare('DELETE FROM sessions WHERE token_hash=?').run(tokenHash); },
  async sessionUser(tokenHash, now) {
    getDb().prepare('DELETE FROM sessions WHERE token_hash=? AND expires_at<=?').run(tokenHash, now); // expired sessions are removed when next seen
    const r = getDb().prepare('SELECT u.id,u.email FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=? AND s.expires_at>?').get(tokenHash, now) as { id: number; email: string } | undefined;
    return r ? { id: String(r.id), email: r.email } : null;
  },
  async recordAttempt(userId, num, selected, isCorrect, ms, mode, now = Date.now()) {
    const db = getDb(); const uid = id(userId);
    return db.transaction(() => {
      db.prepare('INSERT INTO attempts(user_id,question_num,selected,is_correct,ms,mode,created_at) VALUES(?,?,?,?,?,?,?)')
        .run(uid, num, JSON.stringify(selected), isCorrect ? 1 : 0, ms, mode, now);
      const row = db.prepare('SELECT attempts,correct,streak_wrong,box,last_at,due_at FROM progress WHERE user_id=? AND question_num=?').get(uid, num) as Progress | undefined;
      const next = nextProgress(row, isCorrect, now);
      db.prepare(`INSERT INTO progress(user_id,question_num,attempts,correct,streak_wrong,box,last_at,due_at) VALUES(?,?,?,?,?,?,?,?)
        ON CONFLICT(user_id,question_num) DO UPDATE SET attempts=excluded.attempts,correct=excluded.correct,streak_wrong=excluded.streak_wrong,box=excluded.box,last_at=excluded.last_at,due_at=excluded.due_at`)
        .run(uid, num, next.attempts, next.correct, next.streak_wrong, next.box, next.last_at, next.due_at);
      return next;
    })();
  },
  async getProgress(userId) {
    return getDb().prepare('SELECT question_num,attempts,correct,streak_wrong,box,last_at,due_at FROM progress WHERE user_id=?').all(id(userId)) as any[];
  },
  async getAttempts(userId, limit = 500, since = 0) {
    const rows = getDb().prepare('SELECT question_num,selected,is_correct,created_at,mode FROM attempts WHERE user_id=? AND created_at>=? ORDER BY created_at DESC, id DESC LIMIT ?').all(id(userId), since, limit) as any[];
    return rows.map((r) => ({ ...r, selected: JSON.parse(r.selected), is_correct: !!r.is_correct }));
  },
  async getBookmarks(userId) {
    return (getDb().prepare('SELECT question_num FROM bookmarks WHERE user_id=? ORDER BY created_at').all(id(userId)) as any[]).map((r) => r.question_num);
  },
  async setBookmark(userId, num, on) {
    if (on) getDb().prepare('INSERT OR IGNORE INTO bookmarks(user_id,question_num,created_at) VALUES(?,?,?)').run(id(userId), num, Date.now());
    else getDb().prepare('DELETE FROM bookmarks WHERE user_id=? AND question_num=?').run(id(userId), num);
  },
  async getLessonStatus(userId) {
    const rows = getDb().prepare('SELECT ts_id,status FROM lesson_progress WHERE user_id=?').all(id(userId)) as any[];
    return Object.fromEntries(rows.map((r) => [r.ts_id, r.status]));
  },
  async setLessonStatus(userId, tsId, status) {
    getDb().prepare(`INSERT INTO lesson_progress(user_id,ts_id,status,updated_at) VALUES(?,?,?,?)
      ON CONFLICT(user_id,ts_id) DO UPDATE SET status=excluded.status,updated_at=excluded.updated_at`).run(id(userId), tsId, status, Date.now());
  },
  async createExam(userId, nums, now = Date.now()) {
    return String(getDb().prepare('INSERT INTO exams(user_id,nums,started_at) VALUES(?,?,?)').run(id(userId), JSON.stringify(nums), now).lastInsertRowid);
  },
  async getExam(userId, examId) {
    const r = getDb().prepare('SELECT * FROM exams WHERE id=? AND user_id=?').get(id(examId), id(userId)); return r ? examRow(r) : null;
  },
  async listExams(userId) { return (getDb().prepare('SELECT * FROM exams WHERE user_id=? ORDER BY started_at DESC LIMIT 50').all(id(userId)) as any[]).map(examRow); },
  async submitExam(userId, examId, result, now = Date.now()) {
    return getDb().prepare('UPDATE exams SET submitted_at=?, result=? WHERE id=? AND user_id=? AND submitted_at IS NULL').run(now, JSON.stringify(result), id(examId), id(userId)).changes === 1;
  },
};
const examRow = (r: any) => ({ id: String(r.id), nums: JSON.parse(r.nums), started_at: r.started_at, submitted_at: r.submitted_at, result: r.result ? JSON.parse(r.result) : null });
