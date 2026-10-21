import { z } from 'zod';
import { getTaskStatement } from '@/core/content';
import { json, isJson, requireUser } from '@/core/http';
import { repo } from '@/core/repo';
export async function POST(req: Request) {
  const u = await requireUser(); if (!u) return json({ error: 'unauthorized' }, 401);
  if (!isJson(req)) return json({ error: 'bad_request' }, 400);
  const p = z.object({ ts: z.string(), status: z.enum(['not_started', 'learning', 'done']) }).safeParse(await req.json().catch(() => null));
  if (!p.success || !getTaskStatement(p.data.ts)) return json({ error: 'invalid' }, 400);
  await repo.setLessonStatus(u.id, p.data.ts, p.data.status); return json({ ok: true });
}
