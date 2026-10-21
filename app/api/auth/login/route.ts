import { z } from 'zod';
import { checkLogin, startSession, throttled, noteFailure, clearFailures } from '@/core/auth';
import { fail, handler } from '@/core/http';
const Body = z.object({ email: z.string().email().max(200), password: z.string().min(1).max(200) });
export const POST = handler({ auth: false, body: Body, invalid: '请输入邮箱和密码' }, async ({ body }) => {
  const key = body.email.toLowerCase();
  if (throttled(key)) fail(429, 'throttled', '尝试次数过多，请 1 分钟后再试');
  const id = await checkLogin(body.email, body.password);
  if (!id) { noteFailure(key); fail(401, 'bad_credentials', '邮箱或密码不正确'); }
  clearFailures(key); await startSession(id!);
  return { ok: true };
});
