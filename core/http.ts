import { NextResponse } from 'next/server';
import { currentUser } from './auth';
export const json = (data: unknown, status = 200) => NextResponse.json(data, { status });
export async function requireUser() {
  const u = await currentUser();
  return u;
}
/** Reject cross-site mutations: require JSON content type (not sendable by plain HTML forms). */
export function isJson(req: Request) { return (req.headers.get('content-type') || '').includes('application/json'); }
