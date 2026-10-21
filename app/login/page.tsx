import LoginForm from '@/components/auth/LoginForm';
import { googleClientId, inviteRequired } from '@/core/auth';
export const dynamic = 'force-dynamic';
/** Only same-site paths: a login link must not become an open redirect. */
const safeNext = (n?: string) => (n && n.startsWith('/') && !n.startsWith('//') && !n.includes('\\') ? n : '/');
export default async function Login({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  return <LoginForm inviteRequired={inviteRequired()} googleClientId={googleClientId()} next={safeNext((await searchParams).next)} />;
}
