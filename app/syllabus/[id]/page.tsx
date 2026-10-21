import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getDomains, getTaskStatement } from '@/core/content';
import LessonStatus from '@/components/LessonStatus';
import { DOMAIN_ZH } from '@/components/meta';
export function generateStaticParams() { return getDomains().flatMap((d) => d.task_statements.map((t) => ({ id: t.id }))); }
export default async function TS({ params }: { params: Promise<{ id: string }> }) {
  const t = getTaskStatement((await params).id); if (!t) notFound();
  return (
    <div className="space-y-6">
      <p className="muted text-sm"><Link href="/syllabus">课程大纲</Link> › 领域 {t.domain}：{DOMAIN_ZH[t.domain]}</p>
      <header><h1 className="text-2xl font-bold">{t.id}　{t.title_zh}</h1><p className="muted" lang="ja">タスクステートメント{t.id}：{t.title_ja}</p></header>
      <LessonStatus ts={t.id} />
      <section className="card p-4"><h2 className="font-bold">官方大纲：需要掌握的知识（日文原文）</h2><ul className="mt-2 list-disc space-y-1 pl-5 text-sm" lang="ja">{t.knowledge.map((k, i) => <li key={i}>{k}</li>)}</ul></section>
      <section className="card p-4"><h2 className="font-bold">官方大纲：需要能做到的事（日文原文）</h2><ul className="mt-2 list-disc space-y-1 pl-5 text-sm" lang="ja">{t.skills.map((k, i) => <li key={i}>{k}</li>)}</ul></section>
      <section className="card p-4" style={{ background: 'var(--warn-bg)', color: 'var(--warn)' }}><b>课程讲解、实验、对应题目：尚未编写</b><p className="text-sm">本页目前只展示官方大纲原文。中文讲解与实操实验将在课程阶段补充，并标注「AI 草稿 / 人工审核」状态。</p></section>
      <Link className="btn" href={`/practice/run?mode=seq&domain=${t.domain}`}>练习本领域题目</Link>
    </div>
  );
}
