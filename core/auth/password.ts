import crypto from 'crypto';

export function hashPassword(pw: string): string {
  const salt = crypto.randomBytes(16);
  const key = crypto.scryptSync(pw, salt, 64);
  return `scrypt$${salt.toString('hex')}$${key.toString('hex')}`;
}
/** False for any hash that is not scrypt, e.g. the placeholder on Google-created accounts. */
export function verifyPassword(pw: string, stored: string): boolean {
  const [alg, saltHex, keyHex] = stored.split('$');
  if (alg !== 'scrypt') return false;
  const key = crypto.scryptSync(pw, Buffer.from(saltHex, 'hex'), 64);
  const expected = Buffer.from(keyHex, 'hex');
  return key.length === expected.length && crypto.timingSafeEqual(key, expected);
}
