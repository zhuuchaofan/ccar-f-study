'use client';
import Link from 'next/link';
import { useState } from 'react';
import { useStudy } from './useStudy';
import { DOMAIN_ZH } from './meta';
export default function QuestionList({ items }: { items: { num: number; domain: number; excerpt: string; ts: string | null }[] }) {
  const { data } = useStudy();
  const [d, setD] = useState(0); const [f, setF] = useState<'all' | 'wrong' | 'new'>('all');
  const prog = new Map((data?.progress ?? []).map((p) => [p.question_num, p]));
  const rows = items.filter((i) => (!d || i.domain === d) && (f === 'all' || (f === 'wrong' ? (prog.get(i.num)?.streak_wrong ?? 0) > 0 : !prog.has(i.num))));
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">题库 <span className="muted text-base font-normal">（{rows.length} / {items.length}）</span></h1>
      <div className="flex flex-wrap gap-2">
        <select aria-label="领域" className="field" style={{ width: 'auto' }} value={d} onChange={(e) => setD(Number(e.target.value))}><option value={0}>全部领域</option>{[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>领域 {n}：{DOMAIN_ZH[n]}</option>)}</select>
        <select aria-label="状态" className="field" style={{ width: 'auto' }} value={f} onChange={(e) => setF(e.target.value as any)}><option value="all">全部</option><option value="wrong">答错过</option><option value="new">没做过</option></select>
      </div>
      <ul className="space-y-2">{rows.map((i) => { const p = prog.get(i.num); return (
        <li key={i.num}><Link className="card flex gap-3 p-3" href={`/practice/run?mode=seq&num=${i.num}`}>
          <b className="w-10 shrink-0">#{i.num}</b><span className="min-w-0 flex-1 text-sm">…{i.excerpt}</span>
          {i.ts && <span className="tag hidden shrink-0 sm:inline-block">{i.ts}</span>}<span className="tag shrink-0">{!p ? '新' : p.streak_wrong > 0 ? '错' : '对'}</span></Link></li>); })}</ul>
    </div>
  );
}
