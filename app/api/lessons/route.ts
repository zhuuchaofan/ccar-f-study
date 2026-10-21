import { z } from 'zod';
import { getTaskStatement } from '@/core/content';
import { fail, handler } from '@/core/http';
import { repo } from '@/core/repo';
const Body = z.object({ ts: z.string(), status: z.enum(['not_started', 'learning', 'done']) });
export const POST = handler({ body: Body }, async ({ user, body }) => {
  if (!getTaskStatement(body.ts)) fail(400, 'invalid');
  await repo.setLessonStatus(user.id, body.ts, body.status); return { ok: true };
});
