// Simplified Leitner spaced repetition. Pure functions; unit-tested.
export const INTERVAL_DAYS = [0, 1, 3, 7, 14, 30]; // index = box (1..5), box 0 = new
const DAY = 86400000;
export type Progress = { attempts: number; correct: number; streak_wrong: number; box: number; last_at: number | null; due_at: number | null };
export const emptyProgress = (): Progress => ({ attempts: 0, correct: 0, streak_wrong: 0, box: 0, last_at: null, due_at: null });

export function applyAttempt(p: Progress, isCorrect: boolean, now: number): Progress {
  const box = isCorrect ? Math.min(5, p.box + 1) : 1;
  // wrong answers come back after 10 minutes (same session), correct ones follow the interval
  const due_at = isCorrect ? now + INTERVAL_DAYS[box] * DAY : now + 10 * 60000;
  return { attempts: p.attempts + 1, correct: p.correct + (isCorrect ? 1 : 0), streak_wrong: isCorrect ? 0 : p.streak_wrong + 1, box, last_at: now, due_at };
}
/** 0..100 mastery estimate: box position blended with lifetime accuracy. */
export function mastery(p: Progress): number {
  if (p.attempts === 0) return 0;
  const acc = p.correct / p.attempts;
  return Math.round((p.box / 5) * 70 + acc * 30);
}
/** Progress row as sent to the client: adds the 0..100 mastery estimate. */
export const withMastery = <T extends Progress>(p: T) => ({ ...p, mastery: mastery(p) });
export const isDue = (p: Progress, now: number) => p.attempts > 0 && p.due_at !== null && p.due_at <= now;
/** Shared by both storage backends so progress math stays identical. */
export const nextProgress = (prev: Progress | undefined, isCorrect: boolean, now: number) => applyAttempt(prev ?? emptyProgress(), isCorrect, now);
