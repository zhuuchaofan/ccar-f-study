import { Firestore } from '@google-cloud/firestore';
import { nextProgress, type ExamRow, type Repo } from './repo';
import type { Progress } from './srs';

/**
 * Firestore layout (all per-user data lives under users/{uid}):
 *   users/{uid}                 { email, pw_hash, created_at }
 *   emails/{email}              { uid }                — makes email unique
 *   sessions/{token_hash}       { uid, email, expires_at }
 *   users/{uid}/attempts/{auto} { question_num, selected, is_correct, ms, mode, created_at }
 *   users/{uid}/progress/{num}  Progress
 *   users/{uid}/bookmarks/{num} { created_at }
 *   users/{uid}/lessons/{ts}    { status, updated_at }
 *   users/{uid}/exams/{auto}    { nums, started_at, submitted_at, result }
 * Only single-field indexes are used, so no composite index setup is needed.
 */
let db: Firestore | null = null;
const fs = () => (db ??= new Firestore({ projectId: process.env.FIRESTORE_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT || undefined, ignoreUndefinedProperties: true }));
const user = (uid: string) => fs().collection('users').doc(uid);
const PROGRESS_FIELDS = ['attempts', 'correct', 'streak_wrong', 'box', 'last_at', 'due_at'] as const;
const pickProgress = (d: any): Progress => Object.fromEntries(PROGRESS_FIELDS.map((k) => [k, d[k] ?? null])) as Progress;

export const firestoreRepo: Repo = {
  async createUser(email, pwHash, now = Date.now()) {
    const ref = user(fs().collection('users').doc().id);
    try {
      await fs().runTransaction(async (tx) => {
        const e = fs().collection('emails').doc(email);
        if ((await tx.get(e)).exists) throw new Error('exists');
        tx.create(e, { uid: ref.id });
        tx.create(ref, { email, pw_hash: pwHash, created_at: now });
      });
      return ref.id;
    } catch { return null; }
  },
  async findUser(email) {
    const e = await fs().collection('emails').doc(email).get(); if (!e.exists) return null;
    const u = await user(e.get('uid')).get(); return u.exists ? { id: u.id, pw_hash: u.get('pw_hash') } : null;
  },
  async createSession(tokenHash, userId, expiresAt) {
    const u = await user(userId).get();
    await fs().collection('sessions').doc(tokenHash).set({ uid: userId, email: u.get('email'), expires_at: expiresAt });
  },
  async deleteSession(tokenHash) { await fs().collection('sessions').doc(tokenHash).delete(); },
  async sessionUser(tokenHash, now) {
    const s = await fs().collection('sessions').doc(tokenHash).get();
    return s.exists && s.get('expires_at') > now ? { id: s.get('uid'), email: s.get('email') } : null;
  },
  async recordAttempt(userId, num, selected, isCorrect, ms, mode, now = Date.now()) {
    const pref = user(userId).collection('progress').doc(String(num));
    return fs().runTransaction(async (tx) => {
      const cur = await tx.get(pref);
      const next = nextProgress(cur.exists ? pickProgress(cur.data()) : undefined, isCorrect, now);
      tx.set(pref, { question_num: num, ...next });
      tx.create(user(userId).collection('attempts').doc(), { question_num: num, selected, is_correct: isCorrect, ms, mode, created_at: now });
      return next;
    });
  },
  async getProgress(userId) {
    return (await user(userId).collection('progress').get()).docs.map((d) => ({ question_num: d.get('question_num'), ...pickProgress(d.data()) }));
  },
  async getAttempts(userId, limit = 500) {
    const s = await user(userId).collection('attempts').orderBy('created_at', 'desc').limit(limit).get();
    return s.docs.map((d) => ({ question_num: d.get('question_num'), selected: d.get('selected'), is_correct: d.get('is_correct'), created_at: d.get('created_at'), mode: d.get('mode') ?? null }));
  },
  async getBookmarks(userId) {
    return (await user(userId).collection('bookmarks').orderBy('created_at').get()).docs.map((d) => Number(d.id));
  },
  async setBookmark(userId, num, on) {
    const ref = user(userId).collection('bookmarks').doc(String(num));
    if (!on) { await ref.delete(); return; }
    await ref.create({ created_at: Date.now() }).catch((e) => { if (e?.code !== 6) throw e; }); // 6 = ALREADY_EXISTS
  },
  async getLessonStatus(userId) {
    return Object.fromEntries((await user(userId).collection('lessons').get()).docs.map((d) => [d.id, d.get('status')]));
  },
  async setLessonStatus(userId, tsId, status) { await user(userId).collection('lessons').doc(tsId).set({ status, updated_at: Date.now() }); },
  async createExam(userId, nums, now = Date.now()) {
    const ref = user(userId).collection('exams').doc();
    await ref.create({ nums, started_at: now, submitted_at: null, result: null }); return ref.id;
  },
  async getExam(userId, id) {
    if (!/^[A-Za-z0-9]{1,40}$/.test(id)) return null;
    const d = await user(userId).collection('exams').doc(id).get(); return d.exists ? exam(d.id, d.data()) : null;
  },
  async listExams(userId) {
    return (await user(userId).collection('exams').orderBy('started_at', 'desc').limit(50).get()).docs.map((d) => exam(d.id, d.data()));
  },
  async submitExam(userId, id, result, now = Date.now()) {
    const ref = user(userId).collection('exams').doc(id);
    return fs().runTransaction(async (tx) => {
      const d = await tx.get(ref);
      if (!d.exists || d.get('submitted_at')) return false;
      tx.update(ref, { submitted_at: now, result }); return true;
    });
  },
};
const exam = (id: string, d: any): ExamRow => ({ id, nums: d.nums, started_at: d.started_at, submitted_at: d.submitted_at ?? null, result: d.result ?? null });
