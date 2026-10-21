import LoginForm from '@/components/LoginForm';
import { inviteRequired } from '@/core/auth';
import { googleClientId } from '@/core/google';
export const dynamic = 'force-dynamic';
export default function Login() { return <LoginForm inviteRequired={inviteRequired()} googleClientId={googleClientId()} />; }
