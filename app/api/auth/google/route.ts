import { z } from 'zod';
import { googleLogin, startSession, throttled, noteFailure, verifyGoogleToken } from '@/core/auth';
import { json, isJson } from '@/core/http';
const Body = z.object({ credential: z.string().min(20).max(5000), invite: z.string().max(200).optional() });
export async function POST(req: Request) {
  if (!isJson(req)) return json({ error: 'bad_request' }, 400);
  const p = Body.safeParse(await req.json().catch(() => null));
  if (!p.success) return json({ error: '谷歌登录失败，请重试' }, 400);
  if (throttled('invite')) return json({ error: '尝试次数过多，请 1 分钟后再试' }, 429);
  const g = await verifyGoogleToken(p.data.credential);
  if (!g || !g.emailVerified) return json({ error: '谷歌登录失败，请重试' }, 401);
  const r = await googleLogin(g.email, p.data.invite);
  if ('error' in r) {
    if (r.error === 'invite_required') return json({ error: 'invite_required' }, 403);
    noteFailure('invite'); return json({ error: '邀请码不正确' }, 403);
  }
  await startSession(r.id);
  return json({ ok: true });
}
