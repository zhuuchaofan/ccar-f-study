import { describe, it, expect, vi, beforeAll } from 'vitest';
process.env.CCAR_DB = ':memory:';
// Route handlers read the session cookie through next/headers; give them an in-memory jar.
const jar = new Map<string, string>();
vi.mock('next/headers', () => ({ cookies: async () => ({ get: (k: string) => (jar.has(k) ? { value: jar.get(k) } : undefined), set: (k: string, v: string) => jar.set(k, v), delete: (k: string) => jar.delete(k) }) }));
import { POST as register } from '@/app/api/auth/register/route';
import { POST as attempt } from '@/app/api/attempts/route';
import { GET as queue } from '@/app/api/practice/queue/route';
import { GET as question } from '@/app/api/questions/[num]/route';
import { getQuestion } from '@/core/content';

const ctx = (params: Record<string, string> = {}) => ({ params: Promise.resolve(params) });
const post = (body: unknown, type = 'application/json') => new Request('http://x/api', { method: 'POST', headers: { 'content-type': type }, body: JSON.stringify(body) });
const call = async (r: Promise<Response>) => { const res = await r; return { status: res.status, body: await res.json() }; };

describe('API routes: anonymous', () => {
  it('rejects anonymous users with the uniform error shape', async () => {
    expect(await call(question(new Request('http://x/api/questions/1'), ctx({ num: '1' })))).toEqual({ status: 401, body: { error: 'unauthorized', message: '请先登录' } });
  });
});
describe('API routes: signed in', () => {
  beforeAll(async () => { jar.clear(); expect((await call(register(post({ email: `api${Date.now()}@x.com`, password: 'password1' }), ctx()))).status).toBe(200); });
  it('validates bodies: wrong content type, bad payload with a UI message', async () => {
    expect((await call(register(post({}, 'text/plain'), ctx()))).body.error).toBe('bad_request');
    expect(await call(register(post({ email: 'nope' }), ctx()))).toEqual({ status: 400, body: { error: 'invalid', message: '邮箱格式不正确，或密码少于 8 位' } });
  });
  it('answers never leak before submit; attempts grade and return explanations', async () => {
    const q = (await call(question(new Request('http://x'), ctx({ num: '5' })))).body;
    expect(q).not.toHaveProperty('answer'); expect(JSON.stringify(q)).not.toContain('explanation');
    const r = await call(attempt(post({ num: 5, selected: getQuestion(5)!.answer }), ctx()));
    expect(r.status).toBe(200); expect(r.body.correct).toBe(true); expect(r.body.progress.mastery).toBeGreaterThan(0);
    expect((await call(attempt(post({ num: 5, selected: ['Z'] }), ctx()))).body.error).toBe('invalid_option');
  });
  it('queue validates the mode and honours filters', async () => {
    expect((await call(queue(new Request('http://x/api/practice/queue?mode=bogus'), ctx()))).body.error).toBe('invalid_mode');
    expect((await call(queue(new Request('http://x/api/practice/queue?mode=seq&num=7'), ctx()))).body.nums).toEqual([7]);
  });
});
