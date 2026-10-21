// npm run validate — checks every exam under content/exams/ against the import format. Exit code 1 on any problem.
import fs from 'fs';
import path from 'path';
import { validateExamDir } from './exam-files';

const base = path.join('content', 'exams');
let bad = 0;
for (const id of fs.readdirSync(base).filter((d) => fs.statSync(path.join(base, d)).isDirectory())) {
  const errs = validateExamDir(path.join(base, id), true);
  console.log(errs.length ? `✗ ${id}: ${errs.length} problem(s)` : `✓ ${id}`);
  for (const e of errs) console.log(`  - ${e}`);
  bad += errs.length;
}
process.exit(bad ? 1 : 0);
