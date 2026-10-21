// Minimal in-memory login throttle (per key, per process). Cloud Run is capped at 2 instances, so this stays roughly right.
const fails = new Map<string, { n: number; until: number }>();
export function throttled(key: string) { const f = fails.get(key); return !!f && f.until > Date.now(); }
export function noteFailure(key: string) { const f = fails.get(key) ?? { n: 0, until: 0 }; f.n++; if (f.n >= 5) { f.until = Date.now() + 60_000; f.n = 0; } fails.set(key, f); }
export function clearFailures(key: string) { fails.delete(key); }
