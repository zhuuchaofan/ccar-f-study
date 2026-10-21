'use client';
import Link from 'next/link';
import { useStudy } from './useStudy';
import { Loading } from './ui';
import { CATEGORY_TO_DOMAIN_JS, DOMAIN_ZH, QUESTION_COUNT, TS_IDS } from './meta';

export default function Dashboard() {
  const { data, state } = useStudy();
  if (state === 'loading') return <Loading />;
  if (state === 'anon' || !data) return (
    <section className="card p-6">
      <h1 className="t-title">CCAR-F 学习平台</h1>
      <p className="muted mt-2">Claude Certified Architect – Foundations 备考：官方大纲课程、题库练习、错题复习。中文为主，日文与英文对照。</p>
      <div className="mt-5 flex gap-3"><Link className="btn btn-primary" href="/login">登录 / 注册</Link><Link className="btn" href="/syllabus">先看课程大纲</Link></div>
    </section>
  );
  const { progress, attempts, now, lessons } = data;
  const answered = progress.length;
  const totalAtt = progress.reduce((s, p) => s + p.attempts, 0), totalOk = progress.reduce((s, p) => s + p.correct, 0);
  const due = progress.filter((p) => p.due_at !== null && p.due_at <= now).length;
  const mistakes = progress.filter((p) => p.streak_wrong > 0).length;
  const last = attempts.find((a) => a.mode !== 'exam');
  const byDomain: Record<number, { a: number; c: number }> = {};
  for (const p of progress) { const d = CATEGORY_TO_DOMAIN_JS[p.question_num]; if (!d) continue; (byDomain[d] ??= { a: 0, c: 0 }); byDomain[d].a += p.attempts; byDomain[d].c += p.correct; }
  const weak = Object.entries(byDomain).filter(([, v]) => v.a >= 3).sort((x, y) => x[1].c / x[1].a - y[1].c / y[1].a)[0];
  const nextLesson = TS_IDS.find((id) => lessons[id] !== 'done');
  const resumeHref = last ? `/practice/run?mode=seq&start=${Math.min(QUESTION_COUNT, last.question_num + 1)}` : '/practice/run?mode=seq';
  const tasks = [
    due > 0 && { href: '/practice/run?mode=due', title: `复习到期题 ${due} 道`, sub: '间隔重复：现在复习记得最牢' },
    mistakes > 0 && { href: '/practice/run?mode=mistakes', title: `重做错题 ${mistakes} 道`, sub: '最近一次答错的题' },
    answered < QUESTION_COUNT && { href: '/practice/run?mode=unanswered&limit=10', title: '做 10 道新题', sub: `还有 ${QUESTION_COUNT - answered} 道没做过` },
    weak && { href: `/practice/run?mode=seq&domain=${weak[0]}`, title: `薄弱领域：${DOMAIN_ZH[Number(weak[0])]}`, sub: `正确率 ${Math.round((weak[1].c / weak[1].a) * 100)}%` },
    nextLesson && { href: `/syllabus/${nextLesson}`, title: `学习 Task Statement ${nextLesson}`, sub: '课程讲解与实操练习' },
    answered >= 30 && { href: '/exam', title: '做一次模拟考试', sub: '60 题 · 120 分钟' },
  ].filter(Boolean) as { href: string; title: string; sub: string }[];
  return (
    <div className="space-y-6">
      <section className="card p-6">
        <p className="muted text-sm">继续学习 · 已做 {answered} / {QUESTION_COUNT} 题</p><div className="bar mt-2" role="img" aria-label={`已做 ${answered} / ${QUESTION_COUNT} 题`}><i style={{ width: `${Math.round((answered / QUESTION_COUNT) * 100)}%` }} /></div>
        <h1 className="mt-1 t-title">{last ? `上次做到第 ${last.question_num} 题` : '从第 1 题开始'}</h1>
        <Link href={resumeHref} className="btn btn-primary mt-4">{last ? '继续' : '开始'}</Link>
      </section>
      <section>
        <h2 className="mb-3 t-h2">今天学什么</h2>
        <ul className="space-y-2">{tasks.slice(0, 4).map((t) => (
          <li key={t.href}><Link href={t.href} className="card flex items-center justify-between p-4"><span><b>{t.title}</b><span className="muted block text-sm">{t.sub}</span></span><span aria-hidden>›</span></Link></li>))}</ul>
      </section>
      <section className="muted text-sm">已做 {answered}/{QUESTION_COUNT} 题 · 累计正确率 {totalAtt ? Math.round((totalOk / totalAtt) * 100) : 0}%（练习正确率，非官方评分）</section>
    </div>
  );
}
