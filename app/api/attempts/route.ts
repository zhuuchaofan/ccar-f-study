import { z } from 'zod';
import { explanations, getQuestion, getTaskStatement } from '@/core/content';
import { json, isJson, requireUser } from '@/core/http';
import { repo } from '@/core/repo';
import { mastery } from '@/core/srs';
const Body = z.object({ num: z.number().int().min(1).max(152), selected: z.array(z.string().length(1)).min(1).max(6), ms: z.number().int().min(0).max(3_600_000).nullable().optional(), mode: z.string().max(30).optional() });
export async function POST(req: Request) {
  const u = await requireUser(); if (!u) return json({ error: 'unauthorized' }, 401);
  if (!isJson(req)) return json({ error: 'bad_request' }, 400);
  const p = Body.safeParse(await req.json().catch(() => null));
  if (!p.success) return json({ error: 'invalid' }, 400);
  const q = getQuestion(p.data.num); if (!q) return json({ error: 'not_found' }, 404);
  const labels = new Set(q.options.map((o) => o.label));
  const sel = [...new Set(p.data.selected)].sort();
  if (!sel.every((l) => labels.has(l))) return json({ error: 'invalid_option' }, 400);
  const correct = sel.length === q.answer.length && sel.every((l, i) => l === [...q.answer].sort()[i]);
  const progress = repo.recordAttempt(u.id, q.num, sel, correct, p.data.ms ?? null, p.data.mode ?? null);
  return json({
    correct, answer: q.answer, explanation_en: q.explanation_en, i18n: explanations(q), task_statement: q.task_statement ? { id: q.task_statement, title_zh: getTaskStatement(q.task_statement)?.title_zh ?? '' } : null,
    source: { type: q.source_type, name: q.source_name, pdf_pages: q.pdf_pages, review_status: q.review_status },
    progress: { ...progress, mastery: mastery(progress) },
  });
}
