import crypto from 'crypto';

const sha = (s: string) => crypto.createHash('sha256').update(s).digest('hex');
/** Registration needs INVITE_CODE when it is set (production); open when unset (local dev). */
export function inviteOk(code: string | undefined) {
  const want = process.env.INVITE_CODE;
  if (!want) return true;
  const a = Buffer.from(sha(code ?? '')), b = Buffer.from(sha(want));
  return crypto.timingSafeEqual(a, b);
}
export const inviteRequired = () => !!process.env.INVITE_CODE;
