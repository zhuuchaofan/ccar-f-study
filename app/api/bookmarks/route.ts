import { z } from 'zod';
import { json, isJson, requireUser } from '@/core/http';
import { repo } from '@/core/repo';
export async function GET() { const u = await requireUser(); if (!u) return json({ error: 'unauthorized' }, 401); return json({ nums: await repo.getBookmarks(u.id) }); }
export async function POST(req: Request) {
  const u = await requireUser(); if (!u) return json({ error: 'unauthorized' }, 401);
  if (!isJson(req)) return json({ error: 'bad_request' }, 400);
  const p = z.object({ num: z.number().int().min(1).max(152), on: z.boolean() }).safeParse(await req.json().catch(() => null));
  if (!p.success) return json({ error: 'invalid' }, 400);
  await repo.setBookmark(u.id, p.data.num, p.data.on); return json({ ok: true });
}
