import { describe, it, expect } from 'vitest';
import fs from 'fs';
import { renderClientMeta, getQuestions, MANIFEST } from '@/core/content';
describe('generated client metadata', () => {
  it('components/meta.ts is up to date (run `npm run gen:meta`)', () => { expect(fs.readFileSync('components/meta.ts', 'utf8')).toBe(renderClientMeta()); });
  it('manifest matches the bank', () => { expect(getQuestions().length).toBe(MANIFEST.question_count); });
});
