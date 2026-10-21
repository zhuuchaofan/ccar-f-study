import { z } from 'zod';
import { googleLogin, startSession, throttled, noteFailure, verifyGoogleToken } from '@/core/auth';
import { fail, handler } from '@/core/http';
const Body = z.object({ credential: z.string().min(20).max(5000), invite: z.string().max(200).optional() });
export const POST = handler({ auth: false, body: Body, invalid: '谷歌登录失败，请重试' }, async ({ body }) => {
  if (throttled('invite')) fail(429, 'throttled', '尝试次数过多，请 1 分钟后再试');
  const g = await verifyGoogleToken(body.credential);
  if (!g || !g.emailVerified) fail(401, 'google_failed', '谷歌登录失败，请重试');
  const r = await googleLogin(g!.email, body.invite);
  if ('error' in r) {
    if (r.error === 'invite_required') fail(403, 'invite_required', '这是新账号，请输入邀请码后继续');
    noteFailure('invite'); fail(403, 'invalid_invite', '邀请码不正确');
  }
  await startSession((r as { id: string }).id);
  return { ok: true };
});
