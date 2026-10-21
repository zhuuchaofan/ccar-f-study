import { getQuestion, publicQuestion } from '@/core/content';
import { json, requireUser } from '@/core/http';
export async function GET(_: Request, ctx: { params: Promise<{ num: string }> }) {
  if (!(await requireUser())) return json({ error: 'unauthorized' }, 401);
  const q = getQuestion(Number((await ctx.params).num));
  if (!q) return json({ error: 'not_found' }, 404);
  return json(publicQuestion(q)); // never includes answer/explanation
}
