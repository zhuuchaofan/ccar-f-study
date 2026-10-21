import { z } from 'zod';
import { handler } from '@/core/http';
import { getExam, submitExam } from '@/core/services/exam';
export const GET = handler({}, ({ user, params }) => getExam(user.id, params.id));
const Body = z.object({ answers: z.record(z.string(), z.array(z.string().length(1)).max(6)) });
export const POST = handler({ body: Body }, ({ user, params, body }) => submitExam(user.id, params.id, body.answers));
