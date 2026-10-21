import { handler } from '@/core/http';
import { questionFor } from '@/core/services/practice';
export const GET = handler({}, ({ params }) => questionFor(Number(params.num)));
