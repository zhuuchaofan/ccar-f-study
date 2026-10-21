import LoginForm from '@/components/LoginForm';
import { inviteRequired } from '@/core/auth';
export const dynamic = 'force-dynamic';
export default function Login() { return <LoginForm inviteRequired={inviteRequired()} />; }
