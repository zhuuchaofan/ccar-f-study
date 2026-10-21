import type { Question } from './content';

/** Distinct, sorted labels that exist on the question; anything else is dropped. */
export const normalizeSelection = (q: Question, selected: string[]) => [...new Set(selected)].filter((l) => q.options.some((o) => o.label === l)).sort();
/** Exact-set match: every correct option chosen and nothing else. */
export function isCorrect(q: Question, selected: string[]) {
  const sel = normalizeSelection(q, selected), ans = [...q.answer].sort();
  return sel.length === ans.length && sel.every((l, i) => l === ans[i]);
}
