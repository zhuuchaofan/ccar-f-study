'use client';
import { useEffect, useRef, useState } from 'react';

type GoogleId = { initialize(o: { client_id: string; callback: (r: { credential: string }) => void }): void; renderButton(el: HTMLElement, o: Record<string, unknown>): void };
declare global { interface Window { google?: { accounts: { id: GoogleId } } } }

export default function LoginForm({ inviteRequired, googleClientId, next }: { inviteRequired: boolean; googleClientId: string; next: string }) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [invite, setInvite] = useState('');
  const [err, setErr] = useState(''); const [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setErr('');
    const r = await fetch(`/api/auth/${mode}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(mode === 'register' ? { email, password, invite } : { email, password }) });
    const d = await r.json().catch(() => ({}));
    if (r.ok) location.href = next; else { setErr(d.error || '失败'); setBusy(false); }
  }
  // Google sign-in: a new account needs the invite code, so the credential waits until it is entered.
  const [pending, setPending] = useState<string | null>(null);
  const gbtn = useRef<HTMLDivElement>(null);
  async function google(credential: string, code?: string) {
    setBusy(true); setErr('');
    const r = await fetch('/api/auth/google', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ credential, invite: code }) });
    const d = await r.json().catch(() => ({}));
    if (r.ok) { location.href = next; return; }
    setBusy(false);
    if (d.error === 'invite_required') { setPending(credential); setErr('这是新账号，请输入邀请码后继续'); } else setErr(d.error || '失败');
  }
  const googleRef = useRef(google); googleRef.current = google;
  useEffect(() => {
    if (!googleClientId) return;
    const init = () => {
      const id = window.google?.accounts.id; if (!id || !gbtn.current) return;
      id.initialize({ client_id: googleClientId, callback: (r) => googleRef.current(r.credential) });
      id.renderButton(gbtn.current, { theme: 'outline', size: 'large', text: 'continue_with', width: 288, locale: 'zh-CN' });
    };
    if (window.google) { init(); return; }
    const sc = document.createElement('script'); sc.src = 'https://accounts.google.com/gsi/client'; sc.async = true; sc.onload = init;
    document.head.appendChild(sc);
  }, [googleClientId]);
  if (pending) return (
    <form onSubmit={(e) => { e.preventDefault(); google(pending, invite); }} className="card mx-auto mt-8 max-w-sm space-y-4 p-6">
      <h1 className="text-xl font-bold">输入邀请码</h1>
      <label className="block text-sm">邀请码<input className="field mt-1" autoComplete="off" required autoFocus value={invite} onChange={(e) => setInvite(e.target.value)} /></label>
      {err && <p role="alert" className="text-sm" style={{ color: 'var(--bad)' }}>{err}</p>}
      <button className="btn btn-primary w-full" disabled={busy}>继续</button>
      <button type="button" className="muted w-full text-sm" onClick={() => { setPending(null); setErr(''); }}>返回</button>
    </form>
  );
  return (
    <form onSubmit={submit} className="card mx-auto mt-8 max-w-sm space-y-4 p-6">
      <h1 className="text-xl font-bold">{mode === 'login' ? '登录' : '注册'}</h1>
      <label className="block text-sm">邮箱<input className="field mt-1" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></label>
      <label className="block text-sm">密码（至少 8 位）<input className="field mt-1" type="password" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} minLength={mode === 'register' ? 8 : 1} required value={password} onChange={(e) => setPassword(e.target.value)} /></label>
      {mode === 'register' && inviteRequired && <label className="block text-sm">邀请码<input className="field mt-1" autoComplete="off" required value={invite} onChange={(e) => setInvite(e.target.value)} /></label>}
      {err && <p role="alert" className="text-sm" style={{ color: 'var(--bad)' }}>{err}</p>}
      <button className="btn btn-primary w-full" disabled={busy}>{mode === 'login' ? '登录' : '创建账号'}</button>
      {googleClientId && <><p className="muted text-center text-xs">或</p><div ref={gbtn} className="flex min-h-10 justify-center" /></>}
      <button type="button" className="muted w-full text-sm" onClick={() => setMode(mode === 'login' ? 'register' : 'login')}>{mode === 'login' ? '没有账号？注册' : '已有账号？登录'}</button>
    </form>
  );
}
