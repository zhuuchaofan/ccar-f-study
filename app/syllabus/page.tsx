import Link from 'next/link';
import { getDomains } from '@/core/content';
export default function Syllabus() {
  return (
    <div className="space-y-8">
      <div><h1 className="text-2xl font-bold">官方考试大纲</h1><p className="muted text-sm">依据 Claude Certified Architect – Foundations 试验ガイド v1.0（2026 年 7 月）。5 个领域、30 个 Task Statement。中文标题为 AI 翻译草稿，未经人工审核。</p></div>
      {getDomains().map((d) => (
        <section key={d.id}>
          <h2 className="text-lg font-bold">领域 {d.id}：{d.title_zh} <span className="tag ml-1">{d.weight}%</span></h2>
          <p className="muted text-sm" lang="ja">{d.title_ja}</p>
          <ul className="mt-3 space-y-2">{d.task_statements.map((t) => (
            <li key={t.id}><Link href={`/syllabus/${t.id}`} className="card block p-3"><b>{t.id}</b> {t.title_zh}<span className="muted block text-sm" lang="ja">{t.title_ja}</span></Link></li>))}</ul>
        </section>))}
    </div>
  );
}
