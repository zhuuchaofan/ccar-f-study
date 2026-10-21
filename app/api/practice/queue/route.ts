import { getQuestions, MANIFEST } from '@/core/content';
import { json, requireUser } from '@/core/http';
import { buildQueue, QUEUE_MODES, type QueueMode } from '@/core/queue';
import { repo } from '@/core/repo';
export async function GET(req: Request) {
  const u = await requireUser(); if (!u) return json({ error: 'unauthorized' }, 401);
  const sp = new URL(req.url).searchParams;
  const mode = (sp.get('mode') || 'seq') as QueueMode;
  if (!QUEUE_MODES.includes(mode)) return json({ error: 'invalid_mode' }, 400);
  const n = (k: string) => Number(sp.get(k) || 0);
  const domain = n('domain');
  const nums = buildQueue(
    { mode, domain, ts: sp.get('ts'), dedupe: sp.get('dedupe') === '1', start: n('start'), num: n('num'), limit: Math.min(MANIFEST.question_count, Math.max(0, n('limit'))) },
    { questions: getQuestions(), progress: new Map((await repo.getProgress(u.id)).map((p) => [p.question_num, p])), bookmarks: new Set(await repo.getBookmarks(u.id)), now: Date.now() },
  );
  return json({ mode, domain: domain || null, nums });
}
