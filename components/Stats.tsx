'use client';
import { useEffect } from 'react';
import { useStudy } from './useStudy';
import { Empty, Loading, loginHref } from './ui';
import { CATEGORY_TO_DOMAIN_JS, DOMAIN_ZH } from './meta';
export default function Stats() {
  const { data, state } = useStudy();
  useEffect(() => { if (state === 'anon') location.replace(loginHref('/stats')); }, [state]);
  if (state !== 'ready' || !data) return <Loading />;
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
  if (data.progress.length === 0) return <Empty title="还没有学习记录" href="/practice" cta="去做第一道题">做几道题之后，这里会显示各领域的正确率、掌握度和学习日历。</Empty>;
  return (
    <div className="space-y-8">
      <h1 className="t-title">学习统计</h1>
      <section><h2 className="mb-1 font-bold">各领域掌握度</h2><p className="muted mb-2 text-xs">正确率 = 答对次数 ÷ 作答次数；掌握度 = 题目的间隔复习进度，连续答对越多越高。</p><ul className="space-y-3">{rows.map((r) => (
        <li key={r.d} className="card p-3"><div className="flex justify-between text-sm"><span>领域 {r.d}：{DOMAIN_ZH[r.d]}</span><span className="muted">{r.acc === null ? '未开始' : `正确率 ${r.acc}% · 掌握度 ${r.m}%`}</span></div><div className="bar mt-2" role="img" aria-label={`掌握度 ${r.m}%`}><i style={{ width: `${r.m}%` }} /></div></li>))}</ul></section>
      <section><h2 className="mb-2 font-bold">薄弱领域排行</h2>{rank.length === 0 ? <p className="muted text-sm">做题后显示。</p> : <ol className="list-decimal pl-5 text-sm">{rank.map((r) => <li key={r.d}>领域 {r.d}：{DOMAIN_ZH[r.d]}（{r.acc}%）</li>)}</ol>}</section>
      <section><h2 className="mb-2 font-bold">学习日历（近 28 天）<span className="muted ml-2 text-xs font-normal">颜色越深，当天做题越多</span></h2><div className="grid grid-cols-7 gap-1" role="img" aria-label="近 28 天每日做题数">{days.map((d) => { const n = perDay[d] ?? 0; return <div key={d} title={`${d}：${n} 题`} className="aspect-square rounded" style={{ background: n ? 'var(--accent)' : 'var(--line)', opacity: n ? Math.min(1, 0.3 + n / 15) : 1 }} />; })}</div></section>
    </div>
  );
}
