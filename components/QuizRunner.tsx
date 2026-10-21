'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { DOMAIN_ZH } from './meta';

type PQ = { num: number; category: string; domain: number; stem: string; options: { label: string; text: string }[]; multi: boolean; source_type: string; source_name: string; duplicate_of: number | null };
type Res = { correct: boolean; answer: string[]; explanation_en: string; source: { pdf_pages: number[]; review_status: string }; progress: { mastery: number; box: number } };
const LANGS = [['en', 'English'], ['zh', '中文'], ['ja', '日本語']] as const;

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
  const [lang, setLang] = useState<'en' | 'zh' | 'ja'>('en');
  const [err, setErr] = useState('');
  const t0 = useRef(Date.now());

  useEffect(() => {
    fetch(`/api/practice/queue?${qs}`).then(async (r) => { if (r.status === 401) { location.href = '/login'; return; } const d = await r.json(); setNums(d.nums); setIdx(0); });
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

  if (nums === null) return <p className="muted">加载中…</p>;
  if (nums.length === 0) return <div className="card p-6"><p>这个模式下没有题目。</p><Link className="btn mt-4" href="/practice">返回练习</Link></div>;
  if (idx >= nums.length) return <div className="card p-6"><h1 className="text-xl font-bold">本轮完成</h1><p className="muted mt-1">共 {nums.length} 题。</p><div className="mt-4 flex gap-2"><Link className="btn btn-primary" href="/stats">看统计</Link><Link className="btn" href="/practice">再练一组</Link></div></div>;
  if (!q) return <p className="muted">加载中…</p>;

  const label = (l: string) => res ? (res.answer.includes(l) ? 'ok' : sel.includes(l) ? 'bad' : '') : sel.includes(l) ? 'sel' : '';
  return (
    <article className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="muted">{idx + 1} / {nums.length}</span><span className="tag">第 {q.num} 题</span><span className="tag">领域 {q.domain}：{DOMAIN_ZH[q.domain]}</span>
        <span className="tag tag-warn">第三方题库 · 未审核</span>
        {q.duplicate_of && <span className="tag tag-warn">疑似与第 {q.duplicate_of} 题重复</span>}
        <button className="btn ml-auto" onClick={bookmark} aria-pressed={marks.has(q.num)}>{marks.has(q.num) ? '★ 已收藏' : '☆ 收藏'}</button>
      </div>
      <div role="tablist" aria-label="语言" className="flex gap-2">
        {LANGS.map(([k, n]) => <button key={k} role="tab" aria-selected={lang === k} className={`btn ${lang === k ? 'btn-primary' : ''}`} onClick={() => setLang(k)}>{n}</button>)}
      </div>
      {lang !== 'en' && <p className="card p-3 text-sm" style={{ background: 'var(--warn-bg)', color: 'var(--warn)' }}>{lang === 'zh' ? '中文' : '日语'}译文尚未生成，当前显示英文原文。生成后会标注为「AI 翻译草稿」，与原文区分。</p>}
      <p className="card whitespace-pre-line p-4 leading-relaxed">{q.stem}</p>
      <div role={q.multi ? 'group' : 'radiogroup'} aria-label="选项" className="space-y-2">
        {q.options.map((o, i) => (
          <button key={o.label} role={q.multi ? 'checkbox' : 'radio'} aria-checked={sel.includes(o.label)} className={`opt ${label(o.label)}`} onClick={() => toggle(o.label)} disabled={!!res} data-testid={`opt-${o.label}`}>
            <b className="w-6 shrink-0">{o.label}</b><span>{o.text}</span><span className="muted ml-auto hidden text-xs sm:block">{i + 1}</span>
          </button>))}
      </div>
      {err && <p role="alert" style={{ color: 'var(--bad)' }}>{err}</p>}
      {!res ? <button className="btn btn-primary w-full sm:w-auto" disabled={sel.length === 0} onClick={submit} data-testid="submit">提交答案（Enter）</button> : (
        <section className="space-y-3" data-testid="result" aria-live="polite">
          <p className="card p-3 font-bold" style={{ color: res.correct ? 'var(--ok)' : 'var(--bad)' }}>{res.correct ? '回答正确' : `回答错误，正确答案：${res.answer.join('、')}`}　<span className="muted font-normal">掌握度 {res.progress.mastery}%</span></p>
          <div className="card p-4"><p className="mb-1 text-sm"><span className="tag tag-warn">第三方题库自带解析（英文原文，未核实出处）</span> <span className="muted">PDF 第 {res.source.pdf_pages[0]}{res.source.pdf_pages[1] !== res.source.pdf_pages[0] ? `–${res.source.pdf_pages[1]}` : ''} 页</span></p><p className="text-sm leading-relaxed" lang="en">{res.explanation_en}</p></div>
          <p className="muted text-sm">中文 / 日文解析、各错误选项分析、知识点映射：尚未生成（待审核）。可先到 <Link className="underline" href="/syllabus">课程大纲</Link> 对照 {DOMAIN_ZH[q.domain]} 领域。</p>
          <button className="btn btn-primary" onClick={next} data-testid="next">{idx + 1 < nums.length ? '下一题（Enter）' : '完成'}</button>
        </section>)}
    </article>
  );
}
