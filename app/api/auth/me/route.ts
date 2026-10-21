import { currentUser } from '@/core/auth';
import { json } from '@/core/http';
export async function GET() { const u = await currentUser(); return json({ user: u ? { email: u.email } : null }); }
