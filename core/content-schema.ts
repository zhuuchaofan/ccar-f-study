// Import format for an exam's content (content/exams/<id>/). Used by the loader, `npm run validate` and `npm run import:exam`.
// The full format with examples is in docs/new-exam.md.
import { z } from 'zod';

const label = z.string().regex(/^[A-Z]$/);
export const ManifestSchema = z.object({
  _note: z.string().optional(),
  id: z.string().regex(/^[a-z0-9-]+$/),
  title: z.string().min(1),
  source_language: z.string().min(2),
  syllabus_language: z.string().min(2),
  question_count: z.number().int().positive(),
  domains: z.array(z.object({ id: z.number().int().positive(), category: z.string().min(1), weight: z.number().positive(), short_zh: z.string().min(1) })).min(1),
  duplicate_pairs: z.array(z.tuple([z.number().int(), z.number().int()])).default([]),
});
export const QuestionSchema = z.object({
  num: z.number().int().positive(),
  category: z.string().min(1),                       // must match a manifest domain's `category`
  stem: z.string().min(1),
  options: z.array(z.object({ label, text: z.string().min(1) })).min(2),
  answer: z.array(label).min(1),
  explanation_en: z.string(),
  pdf_pages: z.tuple([z.number().int(), z.number().int()]).default([0, 0]),
  source_type: z.string().default('unknown'),
  source_name: z.string().default(''),
  review_status: z.string().default('unreviewed'),
}).passthrough();
export const SyllabusSchema = z.array(z.object({
  id: z.number().int().positive(),
  title_ja: z.string().min(1),                       // title in the syllabus language
  task_statements: z.array(z.object({ id: z.string().regex(/^\d+\.\d+$/), title_ja: z.string().min(1), knowledge: z.array(z.string()), skills: z.array(z.string()) })).min(1),
})).min(1);
export const TitlesZhSchema = z.object({ domains: z.record(z.string(), z.string()), ts: z.record(z.string(), z.string()) }).passthrough();
const QText = z.object({ stem: z.string().min(1), options: z.record(z.string(), z.string()), explanation: z.string(), takeaway: z.string() });
export const TranslationFileSchema = z.record(z.string().regex(/^\d+$/), z.object({ ts: z.string().optional(), zh: QText.optional(), ja: QText.optional() }));

export type Manifest = z.infer<typeof ManifestSchema>;

/** Cross-file checks the schemas cannot express. Returns human-readable problems (empty = valid). */
export function checkExam(m: Manifest, questions: z.infer<typeof QuestionSchema>[], syllabus: z.infer<typeof SyllabusSchema>, translations: z.infer<typeof TranslationFileSchema> = {}, lessonIds: string[] = []): string[] {
  const errs: string[] = [];
  const nums = questions.map((q) => q.num);
  if (questions.length !== m.question_count) errs.push(`manifest.question_count is ${m.question_count} but questions.json has ${questions.length}`);
  nums.forEach((n, i) => { if (n !== i + 1) errs.push(`questions must be numbered 1..N in order; position ${i + 1} has num ${n}`); });
  const cats = new Set(m.domains.map((d) => d.category));
  const domainIds = new Set(m.domains.map((d) => d.id));
  const tsIds = new Set(syllabus.flatMap((d) => d.task_statements.map((t) => t.id)));
  for (const d of syllabus) if (!domainIds.has(d.id)) errs.push(`syllabus domain ${d.id} is not in manifest.domains`);
  const w = m.domains.reduce((s, d) => s + d.weight, 0); if (Math.abs(w - 100) > 0.01) errs.push(`domain weights add up to ${w}, expected 100`);
  for (const q of questions) {
    const labels = q.options.map((o) => o.label);
    if (!cats.has(q.category)) errs.push(`#${q.num}: category "${q.category}" is not in manifest.domains`);
    if (labels.join('') !== 'ABCDEFGHIJ'.slice(0, labels.length)) errs.push(`#${q.num}: options must be lettered A, B, C… in order`);
    for (const a of q.answer) if (!labels.includes(a)) errs.push(`#${q.num}: answer ${a} is not an option`);
  }
  for (const [a, b] of m.duplicate_pairs) if (!nums.includes(a) || !nums.includes(b)) errs.push(`duplicate pair [${a}, ${b}] refers to a missing question`);
  for (const [k, t] of Object.entries(translations)) {
    const q = questions.find((x) => x.num === Number(k)); if (!q) { errs.push(`translation for missing question ${k}`); continue; }
    if (t.ts && !tsIds.has(t.ts)) errs.push(`#${k}: task statement ${t.ts} is not in the syllabus`);
    for (const lang of ['zh', 'ja'] as const) { const x = t[lang]; if (x && Object.keys(x.options).sort().join('') !== q.options.map((o) => o.label).join('')) errs.push(`#${k}: ${lang} options do not match the question's labels`); }
  }
  for (const id of lessonIds) if (!tsIds.has(id)) errs.push(`lesson ${id}.md has no matching task statement`);
  return errs;
}
