import { z } from 'zod';
import { handler } from '@/core/http';
import { listExams, startExam } from '@/core/services/exam';
export const GET = handler({}, ({ user }) => listExams(user.id));
export const POST = handler({ body: z.unknown() }, ({ user }) => startExam(user.id));
