import { describe, it, expect } from 'vitest';
import { getQuestions, getDomains, publicQuestion, domainOf, DOMAIN_WEIGHTS, DUPLICATE_PAIRS } from '@/core/content';
describe('question bank integrity', () => {
  const qs = getQuestions();
  it('has exactly 152 questions numbered 1..152 with no gaps or duplicates', () => {
    expect(qs.length).toBe(152); expect(qs.map((q) => q.num)).toEqual(Array.from({ length: 152 }, (_, i) => i + 1));
  });
  it('category counts match the PDF cover page (36/27/19/31/39)', () => {
    const c: Record<string, number> = {}; qs.forEach((q) => (c[q.category] = (c[q.category] ?? 0) + 1));
    expect(c).toEqual({ 'Claude Code Configuration and Workflows': 36, 'Prompt Engineering and Structured Output': 27, 'Tool Design and MCP Integration': 19, 'Agentic Architecture and Orchestration': 31, 'Context Management and Reliability': 39 });
  });
  it('every answer refers to an existing option; options are lettered A.. consecutively', () => {
    for (const q of qs) { const L = q.options.map((o) => o.label); expect(L).toEqual('ABCDEF'.slice(0, L.length).split('')); expect(q.answer.length).toBeGreaterThan(0); q.answer.forEach((a) => expect(L).toContain(a)); }
  });
  it('Q78 keeps its 3 source options (not padded to 4)', () => { expect(qs.find((q) => q.num === 78)!.options.length).toBe(3); expect(qs.filter((q) => q.options.length === 4).length).toBe(151); });
  it('no watermark residue (CJK) or empty text in any question', () => {
    for (const q of qs) for (const s of [q.stem, q.explanation_en, ...q.options.map((o) => o.text)]) { expect(s.length).toBeGreaterThan(5); expect(/[　-鿿]/.test(s)).toBe(false); }
  });
  it('every question has a PDF page reference and third-party source label', () => { for (const q of qs) { expect(q.pdf_pages[0]).toBeGreaterThan(0); expect(q.source_type).toBe('third_party_bank'); } });
  it('public payload never leaks answer or explanation', () => { for (const q of qs) { const keys = Object.keys(publicQuestion(q)); expect(keys).not.toContain('answer'); expect(keys).not.toContain('explanation_en'); expect(JSON.stringify(publicQuestion(q))).not.toContain('"answer"'); } });
  it('flags the four known duplicate pairs', () => { expect(DUPLICATE_PAIRS).toEqual([[2, 8], [27, 129], [54, 149], [55, 105]]); expect(publicQuestion(qs[7]).duplicate_of).toBe(2); });
});
describe('syllabus', () => {
  const ds = getDomains();
  it('5 domains, 30 task statements, weights sum to 100', () => {
    expect(ds.length).toBe(5); expect(ds.flatMap((d) => d.task_statements).length).toBe(30);
    expect(ds.map((d) => d.task_statements.length)).toEqual([7, 5, 6, 6, 6]); expect(Object.values(DOMAIN_WEIGHTS).reduce((a, b) => a + b, 0)).toBe(100);
  });
  it('every task statement has Japanese title, Chinese title, knowledge and skills', () => { for (const t of ds.flatMap((d) => d.task_statements)) { expect(t.title_ja.length).toBeGreaterThan(5); expect(t.title_zh.length).toBeGreaterThan(3); expect(t.knowledge.length).toBeGreaterThan(0); expect(t.skills.length).toBeGreaterThan(0); } });
  it('domain mapping covers all questions', () => { for (const q of qs()) expect([1, 2, 3, 4, 5]).toContain(domainOf(q)); });
});
function qs() { return getQuestions(); }
