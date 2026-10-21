import { z } from 'zod';
import { MANIFEST } from '@/core/content';
import { handler } from '@/core/http';
import { repo } from '@/core/repo';
export const GET = handler({}, async ({ user }) => ({ nums: await repo.getBookmarks(user.id) }));
const Body = z.object({ num: z.number().int().min(1).max(MANIFEST.question_count), on: z.boolean() });
export const POST = handler({ body: Body }, async ({ user, body }) => { await repo.setBookmark(user.id, body.num, body.on); return { ok: true }; });
