import { z } from 'zod';
import { MANIFEST } from '@/core/content';
import { handler } from '@/core/http';
import { submitAttempt } from '@/core/services/practice';
const Body = z.object({ num: z.number().int().min(1).max(MANIFEST.question_count), selected: z.array(z.string().length(1)).min(1).max(6), ms: z.number().int().min(0).max(3_600_000).nullable().optional(), mode: z.string().max(30).optional() });
export const POST = handler({ body: Body }, ({ user, body }) => submitAttempt(user.id, body));
