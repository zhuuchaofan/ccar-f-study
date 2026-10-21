// Regenerates components/meta.ts from the bank and content/manifest.json. tests/meta.test.ts fails if it is stale.
import fs from 'fs';
import { renderClientMeta } from '../core/content';
fs.writeFileSync('components/meta.ts', renderClientMeta());
console.log('wrote components/meta.ts');
