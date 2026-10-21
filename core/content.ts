import fs from 'fs';
import path from 'path';

export type Option = { label: string; text: string };
export type Question = {
  num: number; category: string; pdf_pages: [number, number]; stem: string; options: Option[];
  answer: string[]; explanation_en: string; source_type: string; source_name: string;
  review_status: string; task_statement: string | null; i18n: Partial<Record<Lang, QText>>;
};
export type Lang = 'zh' | 'ja';
/** AI translation draft for one language (content/q/*.json). */
export type QText = { stem: string; options: Record<string, string>; explanation: string; takeaway: string };
type QFile = Record<string, { ts: string } & Partial<Record<Lang, QText>>>;
export type TaskStatement = { id: string; title_ja: string; title_zh: string; knowledge: string[]; skills: string[]; domain: number };
export type Domain = { id: number; title_ja: string; title_zh: string; weight: number; task_statements: TaskStatement[] };

const root = process.cwd();
const readJson = <T,>(p: string): T => JSON.parse(fs.readFileSync(path.join(root, p), 'utf8'));

export const CATEGORY_TO_DOMAIN: Record<string, number> = {
  'Agentic Architecture and Orchestration': 1,
  'Tool Design and MCP Integration': 2,
  'Claude Code Configuration and Workflows': 3,
  'Prompt Engineering and Structured Output': 4,
  'Context Management and Reliability': 5,
};
export const DOMAIN_WEIGHTS: Record<number, number> = { 1: 27, 2: 18, 3: 20, 4: 20, 5: 15 };
export const DUPLICATE_PAIRS: [number, number][] = [[2, 8], [27, 129], [54, 149], [55, 105], [1, 49], [41, 48], [56, 67]];

let cache: { questions: Question[]; domains: Domain[] } | null = null;
function load() {
  if (cache) return cache;
  const tr: QFile = {};
  const dir = path.join(root, 'content', 'q');
  if (fs.existsSync(dir)) for (const f of fs.readdirSync(dir).filter((f) => f.endsWith('.json')).sort()) Object.assign(tr, readJson<QFile>(`content/q/${f}`));
  const questions = readJson<Question[]>('data/questions_en.json').map((q) => {
    const t = tr[String(q.num)];
    return { ...q, task_statement: t?.ts ?? null, i18n: { ...(t?.zh && { zh: t.zh }), ...(t?.ja && { ja: t.ja }) } };
  });
  const zh = readJson<{ domains: Record<string, string>; ts: Record<string, string> }>('content/ts_zh.json');
  const syl = readJson<{ id: number; title_ja: string; task_statements: Omit<TaskStatement, 'title_zh' | 'domain'>[] }[]>('data/syllabus_ja.json');
  const domains: Domain[] = syl.map((d) => ({
    id: d.id, title_ja: d.title_ja, title_zh: zh.domains[String(d.id)], weight: DOMAIN_WEIGHTS[d.id],
    task_statements: d.task_statements.map((t) => ({ ...t, title_zh: zh.ts[t.id], domain: d.id })),
  }));
  cache = { questions, domains };
  return cache;
}
/** Answer-time payload: explanations and takeaways in every available language. */
export const explanations = (q: Question) => Object.fromEntries(Object.entries(q.i18n).map(([k, v]) => [k, { explanation: v!.explanation, takeaway: v!.takeaway }])) as Partial<Record<Lang, { explanation: string; takeaway: string }>>;
export const getQuestions = () => load().questions;
export const getDomains = () => load().domains;
export const getQuestion = (num: number) => load().questions.find((q) => q.num === num);
export const domainOf = (q: Question) => CATEGORY_TO_DOMAIN[q.category];
export const questionsForTs = (id: string) => load().questions.filter((q) => q.task_statement === id).map((q) => q.num);
/** Lesson markdown (AI draft) for a task statement, or null if not written yet. */
export const getLesson = (id: string) => { const f = path.join(root, 'content', 'lessons', `${id}.md`); return /^\d\.\d$/.test(id) && fs.existsSync(f) ? fs.readFileSync(f, 'utf8') : null; };
export const getTaskStatement = (id: string) => load().domains.flatMap((d) => d.task_statements).find((t) => t.id === id);
/** Question payload sent to the client BEFORE answering: no answer, no explanation. */
export const publicQuestion = (q: Question) => ({
  num: q.num, category: q.category, domain: domainOf(q), stem: q.stem, options: q.options, task_statement: q.task_statement,
  i18n: Object.fromEntries(Object.entries(q.i18n).map(([k, v]) => [k, { stem: v!.stem, options: v!.options }])) as Partial<Record<Lang, { stem: string; options: Record<string, string> }>>,
  multi: q.answer.length > 1, source_type: q.source_type, source_name: q.source_name,
  duplicate_of: DUPLICATE_PAIRS.find((p) => p.includes(q.num))?.find((n) => n !== q.num) ?? null,
});
