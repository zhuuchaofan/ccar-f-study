import { NextResponse } from 'next/server';
import type { z } from 'zod';
import { currentUser } from './auth';

/** Every error response has the same shape: { error: '<code>', message: '<中文 for the UI>' }. */
export class ApiError extends Error {
  constructor(public status: number, public code: string, message?: string) { super(message ?? code); }
}
export const fail = (status: number, code: string, message?: string): never => { throw new ApiError(status, code, message); };
export const json = (data: unknown, status = 200) => NextResponse.json(data, { status });
/** Reject cross-site mutations: require JSON content type (not sendable by plain HTML forms). */
export function isJson(req: Request) { return (req.headers.get('content-type') || '').includes('application/json'); }

type User = { id: string; email: string };
type Ctx<B, A extends boolean> = { req: Request; params: Record<string, string>; body: B; user: A extends true ? User : User | null };
type Opts<B, A extends boolean> = { auth?: A; body?: z.ZodType<B>; invalid?: string };

/**
 * Route wrapper: session check, JSON + zod body parsing, uniform errors. The handler returns plain data (sent as JSON) or a Response.
 * Order matches the old hand-written routes: 401 before 400.
 */
export function handler<B = undefined, A extends boolean = true>(opts: Opts<B, A>, fn: (c: Ctx<B, A>) => unknown) {
  return async (req: Request, ctx: { params: Promise<Record<string, string>> }) => {
    try {
      const user = await currentUser();
      if ((opts.auth ?? true) && !user) fail(401, 'unauthorized', '请先登录');
      let body = undefined as B;
      if (opts.body) {
        if (!isJson(req)) fail(400, 'bad_request');
        const p = opts.body.safeParse(await req.json().catch(() => null));
        if (!p.success) fail(400, 'invalid', opts.invalid);
        body = p.data as B;
      }
      const out = await fn({ req, params: (await ctx?.params) ?? {}, body, user: user as Ctx<B, A>['user'] });
      return out instanceof Response ? out : json(out);
    } catch (e) {
      if (e instanceof ApiError) return json({ error: e.code, message: e.message }, e.status);
      throw e;
    }
  };
}
