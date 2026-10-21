// Reads and checks one exam directory in the import format (see docs/new-exam.md).
import fs from 'fs';
import path from 'path';
import { checkExam, ManifestSchema, QuestionSchema, SyllabusSchema, TitlesZhSchema, TranslationFileSchema } from '../core/content-schema';

/** `strictName`: the directory must be named after manifest.id (true for content/exams/, not for an import source). */
export function validateExamDir(dir: string, strictName = false): string[] {
  const errs: string[] = [];
  const read = (f: string) => { const p = path.join(dir, f); if (!fs.existsSync(p)) { errs.push(`missing ${f}`); return undefined; } try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch (e) { errs.push(`${f}: invalid JSON (${(e as Error).message})`); return undefined; } };
  const parse = <T,>(f: string, schema: { safeParse: (x: unknown) => { success: true; data: T } | { success: false; error: { issues: { path: PropertyKey[]; message: string }[] } } }, raw: unknown) => {
    if (raw === undefined) return undefined;
    const r = schema.safeParse(raw);
    if (!r.success) { for (const i of r.error.issues.slice(0, 20)) errs.push(`${f}: ${i.path.join('.') || '(root)'}: ${i.message}`); return undefined; }
    return r.data;
  };
  const m = parse('manifest.json', ManifestSchema, read('manifest.json'));
  const qs = parse('questions.json', QuestionSchema.array(), read('questions.json'));
  const syl = parse('syllabus.json', SyllabusSchema, read('syllabus.json'));
  if (fs.existsSync(path.join(dir, 'ts_zh.json'))) parse('ts_zh.json', TitlesZhSchema, read('ts_zh.json'));
  const tr: Record<string, any> = {};
  const qdir = path.join(dir, 'q');
  if (fs.existsSync(qdir)) for (const f of fs.readdirSync(qdir).filter((f) => f.endsWith('.json')).sort()) Object.assign(tr, parse(`q/${f}`, TranslationFileSchema, read(`q/${f}`)) ?? {});
  const ldir = path.join(dir, 'lessons');
  const lessons = fs.existsSync(ldir) ? fs.readdirSync(ldir).filter((f) => f.endsWith('.md')).map((f) => f.slice(0, -3)) : [];
  if (m && strictName && path.basename(dir) !== m.id) errs.push(`directory name "${path.basename(dir)}" should equal manifest.id "${m.id}"`);
  if (m && qs && syl) errs.push(...checkExam(m, qs, syl, tr, lessons));
  return errs;
}
