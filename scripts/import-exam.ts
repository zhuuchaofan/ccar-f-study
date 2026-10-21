// npm run import:exam -- <source-dir> [--force]
// Validates a directory in the import format (docs/new-exam.md) and copies it to content/exams/<manifest.id>/.
import fs from 'fs';
import path from 'path';
import { validateExamDir } from './exam-files';

const [src, ...flags] = process.argv.slice(2);
if (!src) { console.error('usage: npm run import:exam -- <source-dir> [--force]'); process.exit(2); }
const errs = validateExamDir(src);
if (errs.length) { console.error(`✗ ${src} is not valid:`); for (const e of errs) console.error(`  - ${e}`); process.exit(1); }
const id = JSON.parse(fs.readFileSync(path.join(src, 'manifest.json'), 'utf8')).id as string;
const dest = path.join('content', 'exams', id);
if (fs.existsSync(dest) && !flags.includes('--force')) { console.error(`✗ ${dest} already exists (use --force to replace it)`); process.exit(1); }
fs.rmSync(dest, { recursive: true, force: true });
fs.cpSync(src, dest, { recursive: true });
console.log(`✓ imported ${id} → ${dest}`);
console.log(`next: EXAM_ID=${id} npm run gen:meta && EXAM_ID=${id} npm test, then deploy with EXAM_ID=${id} (see docs/new-exam.md)`);
