import { endSession } from '@/core/auth';
import { json } from '@/core/http';
export async function POST() { await endSession(); return json({ ok: true }); }
