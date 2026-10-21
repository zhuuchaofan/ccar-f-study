import { MANIFEST } from '@/core/content';
import { fail, handler } from '@/core/http';
import { QUEUE_MODES, type QueueMode } from '@/core/queue';
import { practiceQueue } from '@/core/services/practice';
export const GET = handler({}, async ({ req, user }) => {
  const sp = new URL(req.url).searchParams;
  const mode = (sp.get('mode') || 'seq') as QueueMode;
  if (!QUEUE_MODES.includes(mode)) fail(400, 'invalid_mode');
  const n = (k: string) => Number(sp.get(k) || 0);
  const domain = n('domain');
  const nums = await practiceQueue(user.id, { mode, domain, ts: sp.get('ts'), dedupe: sp.get('dedupe') === '1', start: n('start'), num: n('num'), limit: Math.min(MANIFEST.question_count, Math.max(0, n('limit'))) });
  return { mode, domain: domain || null, nums };
});
