'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
export default function NavUser() {
  const [email, setEmail] = useState<string | null | undefined>(undefined);
  useEffect(() => { fetch('/api/auth/me').then((r) => r.json()).then((d) => setEmail(d.user?.email ?? null)).catch(() => setEmail(null)); }, []);
  const toggle = () => { const el = document.documentElement; const dark = getComputedStyle(el).getPropertyValue('--bg').trim() === '#141311'; const t = dark ? 'light' : 'dark'; el.dataset.theme = t; try { localStorage.setItem('theme', t); } catch {} };
  return (
    <span className="flex items-center gap-3">
      <button onClick={toggle} aria-label="切换浅色/深色模式" className="muted">◐</button>
      {email === undefined ? null : email ? (
        <button className="muted" onClick={async () => { await fetch('/api/auth/logout', { method: 'POST' }); location.href = '/'; }}>退出</button>
      ) : <Link href="/login">登录</Link>}
    </span>
  );
}
