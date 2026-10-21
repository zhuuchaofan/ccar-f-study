'use client';
import Link from 'next/link';
import { useState } from 'react';
import { useStudy } from './useStudy';
import { DOMAIN_ZH } from '../meta';
export default function QuestionList({ items }: { items: { num: number; domain: number; excerpt: string; ts: string | null }[] }) {
  const { data } = useStudy();
  const [d, setD] = useState(0); const [f, setF] = useState<'all' | 'wrong' | 'new'>('all'); const [kw, setKw] = useState('');
  const prog = new Map((data?.progress ?? []).map((p) => [p.question_num, p]));
  const k = kw.trim().toLowerCase();
  const rows = items.filter((i) => (!d || i.domain === d) && (!k || String(i.num) === k.replace('#', '') || i.excerpt.toLowerCase().includes(k)) && (f === 'all' || (f === 'wrong' ? (prog.get(i.num)?.streak_wrong ?? 0) > 0 : !prog.has(i.num))));
  return (
    <div className="space-y-4">
      <h1 className="t-title">题库 <span className="muted text-base font-normal">（{rows.length} / {items.length}）</span></h1>
      <input className="field" type="search" placeholder="搜索关键词或题号" aria-label="搜索题目" value={kw} onChange={(e) => setKw(e.target.value)} />
      <div className="flex flex-wrap items-center gap-2">
        <select aria-label="领域" className="field" style={{ width: 'auto' }} value={d} onChange={(e) => setD(Number(e.target.value))}><option value={0}>全部领域</option>{[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>领域 {n}：{DOMAIN_ZH[n]}</option>)}</select>
        <div className="seg" role="group" aria-label="状态">{([['all', '全部'], ['wrong', '答错过'], ['new', '没做过']] as const).map(([v, n]) => <button key={v} aria-pressed={f === v} onClick={() => setF(v)}>{n}</button>)}</div>
      </div>
      <ul className="space-y-2">{rows.map((i) => { const p = prog.get(i.num); return (
        <li key={i.num}><Link className="card block p-3" href={`/practice/run?mode=seq&num=${i.num}`}>
          <span className="flex gap-3"><b className="w-10 shrink-0">#{i.num}</b><span className="min-w-0 flex-1 text-sm">…{i.excerpt}</span></span>
          <span className="mt-2 flex flex-wrap gap-2 pl-[3.25rem]"><span className="tag">领域 {i.domain}{i.ts ? ` · ${i.ts}` : ''}</span><span className="tag">{!p ? '新' : p.streak_wrong > 0 ? '错' : '对'}</span></span></Link></li>); })}</ul>
      {rows.length === 0 && <p className="muted text-center text-sm">没有符合条件的题目。</p>}
    </div>
  );
}
