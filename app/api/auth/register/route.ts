import { z } from 'zod';
import { createUser, inviteOk, startSession, throttled, noteFailure } from '@/core/auth';
import { json, isJson } from '@/core/http';
const Body = z.object({ email: z.string().email().max(200), password: z.string().min(8).max(200), invite: z.string().max(200).optional() });
export async function POST(req: Request) {
  if (!isJson(req)) return json({ error: 'bad_request' }, 400);
  const p = Body.safeParse(await req.json().catch(() => null));
  if (!p.success) return json({ error: '邮箱格式不正确，或密码少于 8 位' }, 400);
  if (throttled('invite')) return json({ error: '尝试次数过多，请 1 分钟后再试' }, 429);
  if (!inviteOk(p.data.invite)) { noteFailure('invite'); return json({ error: '邀请码不正确' }, 403); }
  const id = await createUser(p.data.email, p.data.password);
  if (!id) return json({ error: '该邮箱已注册' }, 409);
  await startSession(id);
  return json({ ok: true });
}
