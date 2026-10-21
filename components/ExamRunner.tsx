'use client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { DOMAIN_ZH } from './meta';
import { LangTabs, useLang, type Lang } from './lang';
import { Loading } from './ui';

type PQ = { num: number; domain: number; stem: string; options: { label: string; text: string }[]; multi: boolean; i18n: Partial<Record<'zh' | 'ja', { stem: string; options: Record<string, string> }>> };
type Item = { num: number; selected: string[]; answer: string[]; correct: boolean; domain: number };
type Expl = { en: string } & Partial<Record<'zh' | 'ja', { explanation: string; takeaway: string }>>;
type Exam = { id: number; started_at: number; submitted_at: number | null; deadline: number; now: number; questions: PQ[]; result: null | { correct: number; total: number; by_domain: Record<string, { correct: number; total: number }>; items: Item[]; explanations: Record<string, Expl> } };
const pct = (a: number, b: number) => (b ? Math.round((a / b) * 100) : 0);
const fmt = (ms: number) => { const s = Math.max(0, Math.floor(ms / 1000)); return `${Math.floor(s / 3600)}:${String(Math.floor((s % 3600) / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`; };
const store = { get: (k: string) => { try { return localStorage.getItem(k); } catch { return null; } }, set: (k: string, v: string) => { try { localStorage.setItem(k, v); } catch {} }, del: (k: string) => { try { localStorage.removeItem(k); } catch {} } };

const text = (q: PQ, lang: Lang) => { const t = lang !== 'en' ? q.i18n?.[lang] : undefined; return { stem: t?.stem ?? q.stem, opt: (l: string, en: string) => t?.options[l] ?? en, lang: t ? lang : 'en' }; };

export default function ExamRunner({ id }: { id: string }) {
  const [exam, setExam] = useState<Exam | null>(null);
  const [err, setErr] = useState('');
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [flags, setFlags] = useState<Set<number>>(new Set());
  const [idx, setIdx] = useState(0);
  const [left, setLeft] = useState(0);
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [lang, setLang] = useLang();
  const skew = useRef(0);
  const key = `exam-${id}`;

  useEffect(() => {
    fetch(`/api/exam/${id}`).then(async (r) => {
      if (r.status === 401) { location.href = '/login'; return; }
      if (!r.ok) { setErr('找不到这场考试。'); return; }
      const d: Exam = await r.json(); skew.current = d.now - Date.now(); setExam(d);
      const saved = store.get(key); if (saved && !d.result) { try { const s = JSON.parse(saved); setAnswers(s.answers || {}); setFlags(new Set(s.flags || [])); } catch {} }
    });
  }, [id, key]);
  useEffect(() => { if (exam && !exam.result) store.set(key, JSON.stringify({ answers, flags: [...flags] })); }, [answers, flags, exam, key]);

  const submit = useCallback(async () => {
    if (busy) return; setBusy(true);
    const r = await fetch(`/api/exam/${id}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ answers }) });
    setBusy(false);
    if (r.ok || r.status === 409) { store.del(key); const d = r.ok ? await r.json() : await (await fetch(`/api/exam/${id}`)).json(); setExam(d); window.scrollTo(0, 0); }
    else setErr('交卷失败，请重试');
  }, [answers, id, key, busy]);

  useEffect(() => {
    if (!exam || exam.result) return;
    const tick = () => { const l = exam.deadline - (Date.now() + skew.current); setLeft(l); if (l <= 0) submit(); };
    tick(); const t = setInterval(tick, 1000); return () => clearInterval(t);
  }, [exam, submit]);

  if (err && !exam) return <div className="card p-6"><p>{err}</p><Link className="btn mt-4" href="/exam">返回</Link></div>;
  if (!exam) return <Loading />;
  if (exam.result) return <ExamResult exam={exam} lang={lang} setLang={setLang} />;

  const q = exam.questions[idx]; const t = text(q, lang); const sel = answers[q.num] ?? [];
  const answered = exam.questions.filter((x) => (answers[x.num] ?? []).length).length;
  const choose = (l: string) => setAnswers((a) => ({ ...a, [q.num]: q.multi ? (sel.includes(l) ? sel.filter((x) => x !== l) : [...sel, l]) : [l] }));
  const flag = () => setFlags((f) => { const n = new Set(f); n.has(q.num) ? n.delete(q.num) : n.add(q.num); return n; });
  return (
    <article className="space-y-4">
      <div className="card sticky top-0 z-10 flex flex-wrap items-center gap-3 p-3 text-sm">
        <b>模拟考试</b><span className="muted">已答 {answered}/{exam.questions.length}</span>
        <span className={`ml-auto font-mono text-base ${left < 600000 ? 'font-bold' : ''}`} style={left < 600000 ? { color: 'var(--bad)' } : undefined} aria-label="剩余时间" data-testid="timer">{fmt(left)}</span>
      </div>
      <LangTabs lang={lang} setLang={setLang} />
      <div className="flex flex-wrap items-center gap-2 text-sm"><span className="tag">第 {idx + 1} / {exam.questions.length} 题</span><span className="tag">领域 {q.domain}</span>{t.lang !== 'en' && <span className="tag tag-warn">AI 翻译草稿</span>}
        <button className="btn ml-auto" onClick={flag} aria-pressed={flags.has(q.num)}>{flags.has(q.num) ? '⚑ 已标记' : '⚐ 标记稍后检查'}</button></div>
      <p className="card whitespace-pre-line p-4 leading-relaxed" lang={t.lang}>{t.stem}</p>
      <div role={q.multi ? 'group' : 'radiogroup'} aria-label="选项" className="space-y-2">
        {q.options.map((o) => <button key={o.label} role={q.multi ? 'checkbox' : 'radio'} aria-checked={sel.includes(o.label)} className={`opt ${sel.includes(o.label) ? 'sel' : ''}`} onClick={() => choose(o.label)} data-testid={`opt-${o.label}`}><b className="w-6 shrink-0">{o.label}</b><span lang={t.lang}>{t.opt(o.label, o.text)}</span></button>)}
      </div>
      <div className="flex gap-2">
        <button className="btn" disabled={idx === 0} onClick={() => setIdx(idx - 1)}>‹ 上一题</button>
        <button className="btn btn-primary" disabled={idx === exam.questions.length - 1} onClick={() => setIdx(idx + 1)} data-testid="exam-next">下一题 ›</button>
      </div>
      <section className="card p-3" aria-label="题目导航">
        <p className="muted mb-2 text-xs">题目导航：实心为已答，⚑ 为标记</p>
        <div className="grid grid-cols-6 gap-2 sm:grid-cols-10">{exam.questions.map((x, i) => {
          const done = (answers[x.num] ?? []).length > 0;
          return <button key={x.num} onClick={() => setIdx(i)} aria-label={`第 ${i + 1} 题${done ? '，已答' : ''}${flags.has(x.num) ? '，已标记' : ''}`} aria-current={i === idx}
            className="rounded-md border text-xs" style={{ minHeight: 44, borderColor: i === idx ? 'var(--accent)' : 'var(--line)', background: done ? 'var(--accent)' : 'var(--surface)', color: done ? 'var(--accent-ink)' : 'var(--ink)', fontWeight: i === idx ? 700 : 400 }}>{flags.has(x.num) ? '⚑' : i + 1}</button>;
        })}</div>
      </section>
      {err && <p role="alert" style={{ color: 'var(--bad)' }}>{err}</p>}
      {!confirm ? <button className="btn w-full" onClick={() => setConfirm(true)} data-testid="exam-submit">交卷</button> : (
        <div className="card space-y-3 p-4" role="alertdialog" aria-label="确认交卷">
          <p>确定交卷吗？{answered < exam.questions.length ? `还有 ${exam.questions.length - answered} 题没答，` : ''}{flags.size ? `有 ${flags.size} 题标记待检查，` : ''}交卷后不能修改。</p>
          <div className="flex gap-2"><button className="btn btn-primary" disabled={busy} onClick={submit} data-testid="exam-confirm">确认交卷</button><button className="btn" onClick={() => setConfirm(false)}>继续答题</button></div>
        </div>)}
    </article>
  );
}

function ExamResult({ exam, lang, setLang }: { exam: Exam; lang: Lang; setLang: (l: Lang) => void }) {
  const r = exam.result!; const [filter, setFilter] = useState<'wrong' | 'all'>('wrong');
  const qmap = useMemo(() => new Map(exam.questions.map((q) => [q.num, q])), [exam]);
  const items = r.items.filter((i) => filter === 'all' || !i.correct);
  const mins = Math.round(((exam.submitted_at ?? exam.deadline) - exam.started_at) / 60000);
  return (
    <div className="space-y-6" data-testid="exam-result">
      <section className="card p-6">
        <p className="muted text-sm">模拟考试结果 · 用时 {mins} 分钟</p>
        <h1 className="mt-1 text-3xl font-bold">{pct(r.correct, r.total)}%<span className="muted ml-2 text-base font-normal">答对 {r.correct} / {r.total}</span></h1>
        <p className="muted mt-2 text-sm">这是练习正确率，不是官方 720/1000 的换算分数，题目也来自第三方题库。可以把它当作复习方向的参考。</p>
      </section>
      <section className="card p-4"><h2 className="mb-3 font-bold">各领域</h2><ul className="space-y-3">{Object.entries(r.by_domain).sort().map(([d, v]) => (
        <li key={d}><div className="flex justify-between text-sm"><span>领域 {d}：{DOMAIN_ZH[Number(d)]}</span><span>{v.correct}/{v.total} · {pct(v.correct, v.total)}%</span></div><div className="bar mt-1"><i style={{ width: `${pct(v.correct, v.total)}%` }} /></div></li>))}</ul></section>
      <div className="flex flex-wrap gap-2"><Link className="btn btn-primary" href="/practice/run?mode=mistakes">去重做错题</Link><Link className="btn" href="/exam">再考一次</Link></div>
      <section className="space-y-3">
        <div className="flex flex-wrap items-center gap-2"><h2 className="font-bold">逐题回顾</h2>
          <button className={`btn ${filter === 'wrong' ? 'btn-primary' : ''}`} onClick={() => setFilter('wrong')}>只看错题（{r.total - r.correct}）</button><button className={`btn ${filter === 'all' ? 'btn-primary' : ''}`} onClick={() => setFilter('all')}>全部</button></div>
        <LangTabs lang={lang} setLang={setLang} />
        {items.map((it) => { const q = qmap.get(it.num)!; const t = text(q, lang); const e = r.explanations[it.num]; const te = lang !== 'en' ? e?.[lang] : undefined; return (
          <details key={it.num} className="card p-4">
            <summary className="cursor-pointer"><b style={{ color: it.correct ? 'var(--ok)' : 'var(--bad)' }}>{it.correct ? '✓' : '✗'}</b> 第 {it.num} 题 · 你的答案 {it.selected.join('、') || '未答'} · 正确答案 {it.answer.join('、')}</summary>
            <p className="mt-3 whitespace-pre-line text-sm leading-relaxed" lang={t.lang}>{t.stem}</p>
            <ul className="mt-2 space-y-1 text-sm">{q.options.map((o) => <li key={o.label} className={`opt ${it.answer.includes(o.label) ? 'ok' : it.selected.includes(o.label) ? 'bad' : ''}`} style={{ cursor: 'default' }}><b className="w-6 shrink-0">{o.label}</b><span lang={t.lang}>{t.opt(o.label, o.text)}</span></li>)}</ul>
            {te && <p className="mt-3 text-sm" lang={lang}><b>{lang === 'ja' ? 'ポイント：' : '要点：'}</b>{te.takeaway}</p>}
            <p className="mt-2 text-sm leading-relaxed" lang={te ? lang : 'en'}><span className="tag tag-warn mr-1">{te ? '题库解析 · AI 翻译草稿' : '题库解析（英文）'}</span>{te?.explanation ?? e?.en}</p>
          </details>); })}
      </section>
    </div>
  );
}
