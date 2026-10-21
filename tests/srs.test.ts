import { describe, it, expect } from 'vitest';
import { applyAttempt, emptyProgress, mastery, isDue, INTERVAL_DAYS } from '@/core/srs';
const DAY = 86400000;
describe('srs', () => {
  it('correct answers climb boxes and schedule by interval', () => {
    let p = emptyProgress(); const t = 1_000_000;
    p = applyAttempt(p, true, t); expect(p.box).toBe(1); expect(p.due_at).toBe(t + INTERVAL_DAYS[1] * DAY);
    p = applyAttempt(p, true, t); expect(p.box).toBe(2); expect(p.due_at).toBe(t + 3 * DAY);
  });
  it('caps at box 5', () => { let p = emptyProgress(); for (let i = 0; i < 9; i++) p = applyAttempt(p, true, 0); expect(p.box).toBe(5); });
  it('a wrong answer resets to box 1, counts streak, and is due within minutes', () => {
    let p = applyAttempt(applyAttempt(emptyProgress(), true, 0), true, 0);
    p = applyAttempt(p, false, 100); expect(p.box).toBe(1); expect(p.streak_wrong).toBe(1); expect(p.due_at).toBe(100 + 600000);
    p = applyAttempt(p, false, 200); expect(p.streak_wrong).toBe(2);
    p = applyAttempt(p, true, 300); expect(p.streak_wrong).toBe(0);
  });
  it('mastery is 0 for unseen, bounded 0..100', () => {
    expect(mastery(emptyProgress())).toBe(0);
    let p = emptyProgress(); for (let i = 0; i < 6; i++) p = applyAttempt(p, true, 0); expect(mastery(p)).toBe(100);
  });
  it('isDue', () => { const p = applyAttempt(emptyProgress(), false, 0); expect(isDue(p, 600000)).toBe(true); expect(isDue(p, 1)).toBe(false); expect(isDue(emptyProgress(), 1e12)).toBe(false); });
});
