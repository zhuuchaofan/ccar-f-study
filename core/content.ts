import fs from 'fs';
import path from 'path';

export type Option = { label: string; text: string };
export type Question = {
  num: number; category: string; pdf_pages: [number, number]; stem: string; options: Option[];
  answer: string[]; explanation_en: string; source_type: string; source_name: string;
  review_status: string; task_statement: string | null;
};
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
export const DUPLICATE_PAIRS: [number, number][] = [[2, 8], [27, 129], [54, 149], [55, 105]];

let cache: { questions: Question[]; domains: Domain[] } | null = null;
function load() {
  if (cache) return cache;
  const questions = readJson<Question[]>('data/questions_en.json');
  const zh = readJson<{ domains: Record<string, string>; ts: Record<string, string> }>('content/ts_zh.json');
  const syl = readJson<{ id: number; title_ja: string; task_statements: Omit<TaskStatement, 'title_zh' | 'domain'>[] }[]>('data/syllabus_ja.json');
  const domains: Domain[] = syl.map((d) => ({
    id: d.id, title_ja: d.title_ja, title_zh: zh.domains[String(d.id)], weight: DOMAIN_WEIGHTS[d.id],
    task_statements: d.task_statements.map((t) => ({ ...t, title_zh: zh.ts[t.id], domain: d.id })),
  }));
  cache = { questions, domains };
  return cache;
}
export const getQuestions = () => load().questions;
export const getDomains = () => load().domains;
export const getQuestion = (num: number) => load().questions.find((q) => q.num === num);
export const domainOf = (q: Question) => CATEGORY_TO_DOMAIN[q.category];
export const getTaskStatement = (id: string) => load().domains.flatMap((d) => d.task_statements).find((t) => t.id === id);
/** Question payload sent to the client BEFORE answering: no answer, no explanation. */
export const publicQuestion = (q: Question) => ({
  num: q.num, category: q.category, domain: domainOf(q), stem: q.stem, options: q.options,
  multi: q.answer.length > 1, source_type: q.source_type, source_name: q.source_name,
  duplicate_of: DUPLICATE_PAIRS.find((p) => p.includes(q.num))?.find((n) => n !== q.num) ?? null,
});
