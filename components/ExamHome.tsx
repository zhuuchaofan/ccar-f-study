'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
type Row = { id: number; started_at: number; submitted_at: number | null; total: number; correct: number | null };
export default function ExamHome() {
  const [rows, setRows] = useState<Row[] | null>(null); const [anon, setAnon] = useState(false); const [busy, setBusy] = useState(false);
  useEffect(() => { fetch('/api/exam').then(async (r) => { if (r.status === 401) { setAnon(true); return; } setRows((await r.json()).exams); }); }, []);
  const start = async () => { setBusy(true); const r = await fetch('/api/exam', { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' }); if (r.ok) location.href = `/exam/${(await r.json()).id}`; else setBusy(false); };
  const open = rows?.find((r) => !r.submitted_at && Date.now() - r.started_at < 120 * 60000);
  return (
    <div className="space-y-6">
      <section className="card space-y-3 p-6">
        <h1 className="text-2xl font-bold">模拟考试</h1>
        <ul className="muted list-disc space-y-1 pl-5 text-sm">
          <li>60 题，限时 120 分钟，题目按官方领域权重（27/18/20/20/15%）从题库随机抽取，不会同时抽到疑似重复的两道题。</li>
          <li>答题过程中不显示对错，可以标记、跳题、回看；时间到自动交卷。</li>
          <li>交卷后显示正确率、各领域得分和逐题解析，答过的题会计入间隔复习。</li>
          <li>题量和时长是本站的设定，结果不是官方 720 分制成绩。</li>
        </ul>
        {anon ? <Link className="btn btn-primary" href="/login">登录后开始</Link> : open ? <Link className="btn btn-primary" href={`/exam/${open.id}`}>继续未完成的考试</Link> : <button className="btn btn-primary" disabled={busy || !rows} onClick={start} data-testid="exam-start">开始考试</button>}
      </section>
      {rows && rows.some((r) => r.submitted_at) && <section><h2 className="mb-2 font-bold">考试记录</h2><ul className="space-y-2">{rows.filter((r) => r.submitted_at).map((r) => (
        <li key={r.id}><Link href={`/exam/${r.id}`} className="card flex justify-between p-3 text-sm"><span>{new Date(r.started_at).toLocaleString('zh-CN')}</span><b>{Math.round(((r.correct ?? 0) / r.total) * 100)}%（{r.correct}/{r.total}）</b></Link></li>))}</ul></section>}
    </div>
  );
}
