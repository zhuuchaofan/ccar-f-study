import { z } from 'zod';
import { checkLogin, startSession, throttled, noteFailure, clearFailures } from '@/core/auth';
import { json, isJson } from '@/core/http';
const Body = z.object({ email: z.string().email().max(200), password: z.string().min(1).max(200) });
export async function POST(req: Request) {
  if (!isJson(req)) return json({ error: 'bad_request' }, 400);
  const p = Body.safeParse(await req.json().catch(() => null));
  if (!p.success) return json({ error: '请输入邮箱和密码' }, 400);
  const key = p.data.email.toLowerCase();
  if (throttled(key)) return json({ error: '尝试次数过多，请 1 分钟后再试' }, 429);
  const id = checkLogin(p.data.email, p.data.password);
  if (!id) { noteFailure(key); return json({ error: '邮箱或密码不正确' }, 401); }
  clearFailures(key); await startSession(id);
  return json({ ok: true });
}
