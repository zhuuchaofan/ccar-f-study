'use client';
import { useState } from 'react';
export default function Login() {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState(''); const [password, setPassword] = useState('');
  const [err, setErr] = useState(''); const [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setErr('');
    const r = await fetch(`/api/auth/${mode}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email, password }) });
    const d = await r.json().catch(() => ({}));
    if (r.ok) location.href = '/'; else { setErr(d.error || '失败'); setBusy(false); }
  }
  return (
    <form onSubmit={submit} className="card mx-auto mt-8 max-w-sm space-y-4 p-6">
      <h1 className="text-xl font-bold">{mode === 'login' ? '登录' : '注册'}</h1>
      <label className="block text-sm">邮箱<input className="field mt-1" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></label>
      <label className="block text-sm">密码（至少 8 位）<input className="field mt-1" type="password" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} minLength={mode === 'register' ? 8 : 1} required value={password} onChange={(e) => setPassword(e.target.value)} /></label>
      {err && <p role="alert" className="text-sm" style={{ color: 'var(--bad)' }}>{err}</p>}
      <button className="btn btn-primary w-full" disabled={busy}>{mode === 'login' ? '登录' : '创建账号'}</button>
      <button type="button" className="muted w-full text-sm" onClick={() => setMode(mode === 'login' ? 'register' : 'login')}>{mode === 'login' ? '没有账号？注册' : '已有账号？登录'}</button>
    </form>
  );
}
