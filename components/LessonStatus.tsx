'use client';
import { useEffect, useState } from 'react';
const L = { not_started: '未开始', learning: '学习中', done: '已掌握' } as const;
export default function LessonStatus({ ts }: { ts: string }) {
  const [s, setS] = useState<keyof typeof L | null>(null); const [anon, setAnon] = useState(false);
  useEffect(() => { fetch('/api/progress').then(async (r) => { if (r.status === 401) { setAnon(true); return; } const d = await r.json(); setS((d.lessons[ts] as any) || 'not_started'); }); }, [ts]);
  if (anon) return <p className="muted text-sm">登录后可记录学习状态。</p>;
  if (!s) return null;
  const set = async (v: keyof typeof L) => { setS(v); await fetch('/api/lessons', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ ts, status: v }) }); };
  return <div className="flex flex-wrap items-center gap-2" role="group" aria-label="学习状态">{(Object.keys(L) as (keyof typeof L)[]).map((k) => <button key={k} className={`btn ${s === k ? 'btn-primary' : ''}`} aria-pressed={s === k} onClick={() => set(k)}>{L[k]}</button>)}</div>;
}
