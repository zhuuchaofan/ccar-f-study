import { handler } from '@/core/http';
import { studySummary } from '@/core/services/practice';
export const GET = handler({}, ({ user }) => studySummary(user.id));
