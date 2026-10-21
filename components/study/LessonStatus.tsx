'use client';
import { useEffect, useState } from 'react';
import { setLesson } from '@/lib/api';
import { invalidateStudy, useStudy } from './useStudy';
const L = { not_started: '未开始', learning: '学习中', done: '已掌握' } as const;
type S = keyof typeof L;
export default function LessonStatus({ ts }: { ts: string }) {
  const { data, state } = useStudy();
  const [s, setS] = useState<S | null>(null);
  useEffect(() => { if (data) setS((data.lessons[ts] as S) || 'not_started'); }, [data, ts]);
  if (state === 'anon') return <p className="muted text-sm">登录后可记录学习状态。</p>;
  if (!s) return null;
  const set = async (v: S) => { setS(v); await setLesson(ts, v); invalidateStudy(); };
  return <div className="seg" role="group" aria-label="学习状态">{(Object.keys(L) as S[]).map((k) => <button key={k} aria-pressed={s === k} onClick={() => set(k)}>{L[k]}</button>)}</div>;
}
