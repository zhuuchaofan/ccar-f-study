import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getDomains, getLesson, getTaskStatement, questionsForTs } from '@/core/content';
import LessonStatus from '@/components/LessonStatus';
import Markdown from '@/components/Markdown';
import { DOMAIN_ZH } from '@/components/meta';
export function generateStaticParams() { return getDomains().flatMap((d) => d.task_statements.map((t) => ({ id: t.id }))); }
export default async function TS({ params }: { params: Promise<{ id: string }> }) {
  const t = getTaskStatement((await params).id); if (!t) notFound();
  const all = getDomains().flatMap((d) => d.task_statements); const i = all.findIndex((x) => x.id === t.id);
  const lesson = getLesson(t.id); const nums = questionsForTs(t.id);
  return (
    <div className="space-y-6">
      <p className="muted text-sm"><Link href="/syllabus">课程大纲</Link> › 领域 {t.domain}：{DOMAIN_ZH[t.domain]}</p>
      <header><h1 className="t-title">{t.id}　{t.title_zh}</h1><p className="muted" lang="ja">タスクステートメント{t.id}：{t.title_ja}</p></header>
      <LessonStatus ts={t.id} />
      <details className="card p-4"><summary className="cursor-pointer font-bold">官方大纲原文（日文）：知识 {t.knowledge.length} 条 · 技能 {t.skills.length} 条</summary>
        <h2 className="mt-3 text-sm font-bold">需要掌握的知识</h2><ul className="mt-1 list-disc space-y-1 pl-5 text-sm" lang="ja">{t.knowledge.map((k, i) => <li key={i}>{k}</li>)}</ul>
        <h2 className="mt-3 text-sm font-bold">需要能做到的事</h2><ul className="mt-1 list-disc space-y-1 pl-5 text-sm" lang="ja">{t.skills.map((k, i) => <li key={i}>{k}</li>)}</ul></details>
      {lesson ? <section className="card p-4 sm:p-6" data-testid="lesson"><p className="mb-2 text-sm"><span className="tag tag-warn">课程讲解 · AI 草稿，未经人工审核</span> <span className="muted">以官方文档为准</span></p><Markdown src={lesson} /></section>
        : <section className="card p-4" style={{ background: 'var(--warn-bg)', color: 'var(--warn)' }}><b>本条课程讲解尚未编写</b></section>}
      <section className="card p-4"><h2 className="font-bold">对应题目（{nums.length}）</h2>
        {nums.length ? <><p className="muted text-sm">题目归类由 AI 判断，仅供参考。</p><div className="mt-2 flex flex-wrap gap-2">{nums.map((n) => <Link key={n} className="tag" href={`/practice/run?mode=seq&num=${n}`}>第 {n} 题</Link>)}</div>
          <Link className="btn btn-primary mt-3" href={`/practice/run?mode=seq&ts=${t.id}`}>练习这 {nums.length} 道题</Link></> : <p className="muted text-sm">暂无归到这一条的题目。</p>}
      </section>
      <nav className="flex justify-between gap-2" aria-label="上一条 / 下一条">
        {i > 0 ? <Link className="btn" href={`/syllabus/${all[i - 1].id}`}>‹ {all[i - 1].id}</Link> : <span />}
        {i < all.length - 1 ? <Link className="btn" href={`/syllabus/${all[i + 1].id}`}>{all[i + 1].id} ›</Link> : <span />}
      </nav>
    </div>
  );
}
