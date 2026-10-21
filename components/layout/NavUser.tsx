'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
export default function NavUser() {
  const [email, setEmail] = useState<string | null | undefined>(undefined);
  useEffect(() => { fetch('/api/auth/me').then((r) => r.json()).then((d) => setEmail(d.user?.email ?? null)).catch(() => setEmail(null)); }, []);
  const [dark, setDark] = useState(false);
  const current = () => { const t = document.documentElement.dataset.theme; return t ? t === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches; };
  useEffect(() => setDark(current()), []);
  const toggle = () => { const t = current() ? 'light' : 'dark'; document.documentElement.dataset.theme = t; setDark(t === 'dark'); try { localStorage.setItem('theme', t); } catch {} };
  return (
    <span className="flex items-center gap-1">
      <button onClick={toggle} aria-label={dark ? '切换到浅色模式' : '切换到深色模式'} className="muted px-3 py-2">{dark ? '☀' : '☾'}</button>
      {email === undefined ? null : email ? (
        <button className="muted px-3 py-2" onClick={async () => { await fetch('/api/auth/logout', { method: 'POST' }); location.href = '/'; }}>退出</button>
      ) : <Link className="px-3 py-2" href="/login">登录</Link>}
    </span>
  );
}
