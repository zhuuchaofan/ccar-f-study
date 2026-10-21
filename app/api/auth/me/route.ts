import { handler } from '@/core/http';
export const GET = handler({ auth: false }, ({ user }) => ({ user: user ? { email: user.email } : null }));
