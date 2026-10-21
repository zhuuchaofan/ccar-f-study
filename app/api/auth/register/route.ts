import { z } from 'zod';
import { createUser, inviteOk, startSession, throttled, noteFailure } from '@/core/auth';
import { fail, handler } from '@/core/http';
const Body = z.object({ email: z.string().email().max(200), password: z.string().min(8).max(200), invite: z.string().max(200).optional() });
export const POST = handler({ auth: false, body: Body, invalid: '邮箱格式不正确，或密码少于 8 位' }, async ({ body }) => {
  if (throttled('invite')) fail(429, 'throttled', '尝试次数过多，请 1 分钟后再试');
  if (!inviteOk(body.invite)) { noteFailure('invite'); fail(403, 'invalid_invite', '邀请码不正确'); }
  const id = (await createUser(body.email, body.password)) ?? fail(409, 'email_taken', '该邮箱已注册');
  await startSession(id);
  return { ok: true };
});
