'use client';
import Link from 'next/link';
import { useStudy } from './useStudy';
import { CATEGORY_TO_DOMAIN_JS, DOMAIN_ZH } from './meta';
export default function Stats() {
  const { data, state } = useStudy();
  if (state === 'loading') return <p className="muted">加载中…</p>;
  if (state === 'anon' || !data) return <p>请先 <Link className="underline" href="/login">登录</Link>。</p>;
  const rows = [1, 2, 3, 4, 5].map((d) => {
    const ps = data.progress.filter((p) => CATEGORY_TO_DOMAIN_JS[p.question_num] === d);
    const a = ps.reduce((s, p) => s + p.attempts, 0), c = ps.reduce((s, p) => s + p.correct, 0);
    const m = ps.length ? Math.round(ps.reduce((s, p) => s + p.mastery, 0) / ps.length) : 0;
    return { d, a, acc: a ? Math.round((c / a) * 100) : null, m, n: ps.length };
  });
  const rank = [...rows].filter((r) => r.acc !== null).sort((x, y) => (x.acc as number) - (y.acc as number));
  const day = (t: number) => new Date(t).toLocaleDateString('sv');
  const perDay: Record<string, number> = {}; for (const a of data.attempts) perDay[day(a.created_at)] = (perDay[day(a.created_at)] ?? 0) + 1;
  const days = Array.from({ length: 28 }, (_, i) => day(Date.now() - (27 - i) * 86400000));
  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">学习统计</h1>
      <section><h2 className="mb-2 font-bold">各领域掌握度</h2><ul className="space-y-3">{rows.map((r) => (
        <li key={r.d} className="card p-3"><div className="flex justify-between text-sm"><span>领域 {r.d}：{DOMAIN_ZH[r.d]}</span><span className="muted">{r.acc === null ? '未开始' : `正确率 ${r.acc}% · 掌握度 ${r.m}%`}</span></div><div className="bar mt-2" role="img" aria-label={`掌握度 ${r.m}%`}><i style={{ width: `${r.m}%` }} /></div></li>))}</ul></section>
      <section><h2 className="mb-2 font-bold">薄弱领域排行</h2>{rank.length === 0 ? <p className="muted text-sm">做题后显示。</p> : <ol className="list-decimal pl-5 text-sm">{rank.map((r) => <li key={r.d}>领域 {r.d}：{DOMAIN_ZH[r.d]}（{r.acc}%）</li>)}</ol>}</section>
      <section><h2 className="mb-2 font-bold">学习日历（近 28 天）</h2><div className="grid grid-cols-7 gap-1" role="img" aria-label="近 28 天每日做题数">{days.map((d) => { const n = perDay[d] ?? 0; return <div key={d} title={`${d}：${n} 题`} className="aspect-square rounded" style={{ background: n ? 'var(--accent)' : 'var(--line)', opacity: n ? Math.min(1, 0.3 + n / 15) : 1 }} />; })}</div></section>
    </div>
  );
}
