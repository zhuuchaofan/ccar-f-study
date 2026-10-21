'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { DOMAIN_ZH } from './meta';
import { LangTabs, useLang } from './lang';
import { Loading, Notice, loginHref } from './ui';

type PQ = { num: number; category: string; domain: number; stem: string; options: { label: string; text: string }[]; multi: boolean; source_type: string; source_name: string; duplicate_of: number | null; i18n: Partial<Record<'zh' | 'ja', { stem: string; options: Record<string, string> }>> };
type Res = { correct: boolean; answer: string[]; explanation_en: string; i18n: Partial<Record<'zh' | 'ja', { explanation: string; takeaway: string }>>; task_statement: { id: string; title_zh: string } | null; source: { pdf_pages: number[]; review_status: string }; progress: { mastery: number; box: number } };

export default function QuizRunner() {
  const sp = useSearchParams();
  const qs = sp.toString();
  const mode = sp.get('mode') || 'seq';
  const [nums, setNums] = useState<number[] | null>(null);
  const [idx, setIdx] = useState(0);
  const [q, setQ] = useState<PQ | null>(null);
  const [sel, setSel] = useState<string[]>([]);
  const [res, setRes] = useState<Res | null>(null);
  const [marks, setMarks] = useState<Set<number>>(new Set());
  const [lang, setLang] = useLang();
  const [err, setErr] = useState('');
  const t0 = useRef(Date.now());

  useEffect(() => {
    fetch(`/api/practice/queue?${qs}`).then(async (r) => { if (r.status === 401) { location.href = loginHref('/practice'); return; } const d = await r.json(); setNums(d.nums); setIdx(0); });
    fetch('/api/bookmarks').then((r) => r.ok ? r.json() : { nums: [] }).then((d) => setMarks(new Set(d.nums)));
  }, [qs]);
  const cur = nums?.[idx];
  useEffect(() => {
    if (cur == null) { setQ(null); return; }
    setQ(null); setSel([]); setRes(null); setErr('');
    fetch(`/api/questions/${cur}`).then((r) => r.json()).then((d) => { setQ(d); t0.current = Date.now(); });
  }, [cur]);

  const toggle = useCallback((l: string) => { if (res || !q) return; setSel((s) => q.multi ? (s.includes(l) ? s.filter((x) => x !== l) : [...s, l]) : [l]); }, [res, q]);
  const submit = useCallback(async () => {
    if (!q || res || sel.length === 0) return;
    const r = await fetch('/api/attempts', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ num: q.num, selected: sel, ms: Date.now() - t0.current, mode }) });
    if (!r.ok) { setErr('提交失败，请重试'); return; }
    setRes(await r.json());
  }, [q, res, sel, mode]);
  const next = useCallback(() => { if (nums && idx + 1 < nums.length) setIdx(idx + 1); else setIdx(nums ? nums.length : 0); }, [nums, idx]);
  const bookmark = useCallback(async () => {
    if (!q) return; const on = !marks.has(q.num);
    await fetch('/api/bookmarks', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ num: q.num, on }) });
    setMarks((m) => { const n = new Set(m); on ? n.add(q.num) : n.delete(q.num); return n; });
  }, [q, marks]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === 'INPUT') return;
      if (!q) return;
      const i = '1234567'.indexOf(e.key);
      if (i >= 0 && i < q.options.length) { toggle(q.options[i].label); }
      else if (e.key === 'Enter') { e.preventDefault(); res ? next() : submit(); }
      else if (e.key.toLowerCase() === 'b') bookmark();
    };
    window.addEventListener('keydown', onKey); return () => window.removeEventListener('keydown', onKey);
  }, [q, res, toggle, submit, next, bookmark]);

  if (nums === null) return <Loading />;
  if (nums.length === 0) return <div className="card p-6"><p>这个模式下没有题目。</p><Link className="btn mt-4" href="/practice">返回练习</Link></div>;
  if (idx >= nums.length) return <div className="card p-6"><h1 className="text-xl font-bold">本轮完成</h1><p className="muted mt-1">共 {nums.length} 题。</p><div className="mt-4 flex gap-2"><Link className="btn btn-primary" href="/stats">看统计</Link><Link className="btn" href="/practice">再练一组</Link></div></div>;
  if (!q) return <Loading />;

  const tq = lang !== 'en' ? q.i18n?.[lang] : undefined;
  const te = lang !== 'en' ? res?.i18n?.[lang] : undefined;
  const label = (l: string) => res ? (res.answer.includes(l) ? 'ok' : sel.includes(l) ? 'bad' : '') : sel.includes(l) ? 'sel' : '';
  return (
    <article className="space-y-4 pb-20">
      <div className="flex items-center gap-2 text-sm">
        <span className="muted shrink-0">{idx + 1} / {nums.length}</span><span className="tag shrink-0">领域 {q.domain}</span>
        <LangTabs lang={lang} setLang={setLang} className="ml-auto" />
        <button className="btn !min-h-10 !px-3" onClick={bookmark} aria-pressed={marks.has(q.num)} aria-label={marks.has(q.num) ? '取消收藏' : '收藏'}>{marks.has(q.num) ? '★' : '☆'}</button>
      </div>
      <p className="muted text-xs">第 {q.num} 题 · {DOMAIN_ZH[q.domain]} · 第三方题库，未审核{tq ? ' · AI 翻译草稿，以英文为准' : ''}{q.duplicate_of ? ` · 疑似与第 ${q.duplicate_of} 题重复` : ''}</p>
      {lang !== 'en' && !tq && <Notice>这道题的{lang === 'zh' ? '中文' : '日文'}译文尚未生成，当前显示英文原文。</Notice>}
      <p className="card whitespace-pre-line p-4 leading-relaxed" lang={tq ? lang : 'en'} data-testid="stem">{tq?.stem ?? q.stem}</p>
      {tq && <details className="text-sm"><summary className="muted cursor-pointer">查看英文原文</summary><div className="card mt-2 space-y-1 p-3" lang="en"><p className="whitespace-pre-line">{q.stem}</p>{q.options.map((o) => <p key={o.label}><b>{o.label}.</b> {o.text}</p>)}</div></details>}
      <div role={q.multi ? 'group' : 'radiogroup'} aria-label="选项" className="space-y-2">
        {q.options.map((o, i) => (
          <button key={o.label} role={q.multi ? 'checkbox' : 'radio'} aria-checked={sel.includes(o.label)} className={`opt ${label(o.label)}`} onClick={() => toggle(o.label)} disabled={!!res} data-testid={`opt-${o.label}`}>
            <b className="w-6 shrink-0">{o.label}</b><span lang={tq ? lang : 'en'}>{tq?.options[o.label] ?? o.text}</span><span className="muted ml-auto hidden text-xs sm:block">{i + 1}</span>
          </button>))}
      </div>
      {err && <p role="alert" style={{ color: 'var(--bad)' }}>{err}</p>}
      <div className="actionbar"><div>{!res
        ? <button className="btn btn-primary w-full" disabled={sel.length === 0} onClick={submit} data-testid="submit">提交答案<span className="hidden sm:inline">（Enter）</span></button>
        : <button className="btn btn-primary w-full" onClick={next} data-testid="next">{idx + 1 < nums.length ? '下一题' : '完成'}<span className="hidden sm:inline">（Enter）</span></button>}</div></div>
      {res && (
        <section className="space-y-3" data-testid="result" aria-live="polite">
          <p className="card p-3 font-bold" style={{ color: res.correct ? 'var(--ok)' : 'var(--bad)' }}>{res.correct ? '回答正确' : `回答错误，正确答案：${res.answer.join('、')}`}　<span className="muted font-normal">掌握度 {res.progress.mastery}%</span></p>
          {te && <p className="card p-3 text-sm" lang={lang}><b>{lang === 'ja' ? 'ポイント：' : '要点：'}</b>{te.takeaway}</p>}
          <div className="card p-4" data-testid="explanation"><p className="mb-1 text-sm"><span className="muted">{te ? '题库解析 · AI 翻译草稿' : '题库自带解析（英文原文）'} · 出处未核实 · PDF 第 {res.source.pdf_pages[0]}{res.source.pdf_pages[1] !== res.source.pdf_pages[0] ? `–${res.source.pdf_pages[1]}` : ''} 页</span></p><p className="text-sm leading-relaxed" lang={te ? lang : 'en'}>{te?.explanation ?? res.explanation_en}</p>
            {te && <details className="mt-2 text-sm"><summary className="muted cursor-pointer">查看英文原文解析</summary><p className="mt-1 leading-relaxed" lang="en">{res.explanation_en}</p></details>}</div>
          {res.task_statement ? <p className="text-sm">对应大纲：<Link className="underline" href={`/syllabus/${res.task_statement.id}`}>{res.task_statement.id} {res.task_statement.title_zh}</Link>（题目归类为 AI 判断）</p>
            : <p className="muted text-sm">这道题还没有对应到大纲条目。可先到 <Link className="underline" href="/syllabus">课程大纲</Link> 对照 {DOMAIN_ZH[q.domain]} 领域。</p>}
        </section>)}
    </article>
  );
}
