import { endSession } from '@/core/auth';
import { handler } from '@/core/http';
export const POST = handler({ auth: false }, async () => { await endSession(); return { ok: true }; });
