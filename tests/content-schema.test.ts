import { describe, it, expect } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { validateExamDir } from '../scripts/exam-files';

const write = (dir: string, files: Record<string, unknown>) => { for (const [f, v] of Object.entries(files)) { fs.mkdirSync(path.dirname(path.join(dir, f)), { recursive: true }); fs.writeFileSync(path.join(dir, f), JSON.stringify(v)); } return dir; };
const tmp = () => fs.mkdtempSync(path.join(os.tmpdir(), 'exam-'));
const manifest = { id: 'demo', title: 'Demo', source_language: 'en', syllabus_language: 'en', question_count: 2, domains: [{ id: 1, category: 'Cat A', weight: 60, short_zh: '甲' }, { id: 2, category: 'Cat B', weight: 40, short_zh: '乙' }], duplicate_pairs: [] };
const q = (num: number, category: string) => ({ num, category, stem: 'Q?', options: [{ label: 'A', text: 'a' }, { label: 'B', text: 'b' }], answer: ['A'], explanation_en: 'because' });
const syllabus = [{ id: 1, title_ja: 'D1', task_statements: [{ id: '1.1', title_ja: 'T', knowledge: [], skills: [] }] }, { id: 2, title_ja: 'D2', task_statements: [{ id: '2.1', title_ja: 'T', knowledge: [], skills: [] }] }];

describe('exam import format', () => {
  it('the shipped exam is valid', () => { expect(validateExamDir('content/exams/ccar-f', true)).toEqual([]); });
  it('accepts a minimal exam', () => { expect(validateExamDir(write(tmp(), { 'manifest.json': manifest, 'questions.json': [q(1, 'Cat A'), q(2, 'Cat B')], 'syllabus.json': syllabus }))).toEqual([]); });
  it('reports missing files, schema errors and cross-file problems', () => {
    expect(validateExamDir(tmp())).toEqual(['missing manifest.json', 'missing questions.json', 'missing syllabus.json']);
    const errs = validateExamDir(write(tmp(), {
      'manifest.json': { ...manifest, question_count: 3, duplicate_pairs: [[1, 9]] },
      'questions.json': [q(1, 'Cat A'), { ...q(2, 'Nope'), answer: ['C'] }],
      'syllabus.json': syllabus,
      'q/001.json': { 1: { ts: '9.9' } },
    }));
    expect(errs).toEqual(expect.arrayContaining([
      'manifest.question_count is 3 but questions.json has 2', '#2: category "Nope" is not in manifest.domains', '#2: answer C is not an option',
      'duplicate pair [1, 9] refers to a missing question', '#1: task statement 9.9 is not in the syllabus',
    ]));
    expect(validateExamDir(write(tmp(), { 'manifest.json': { ...manifest, id: 'Bad Id' }, 'questions.json': [], 'syllabus.json': syllabus }))[0]).toMatch(/^manifest.json: id:/);
  });
});
