import { json, requireUser } from '@/core/http';
import { repo } from '@/core/repo';
import { mastery } from '@/core/srs';
export async function GET() {
  const u = await requireUser(); if (!u) return json({ error: 'unauthorized' }, 401);
  const rows = (await repo.getProgress(u.id)).map((p) => ({ ...p, mastery: mastery(p) }));
  return json({ progress: rows, attempts: await repo.getAttempts(u.id, 2000), lessons: await repo.getLessonStatus(u.id), now: Date.now() });
}
