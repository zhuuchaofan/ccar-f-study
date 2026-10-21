import path from 'path';
import { fileURLToPath } from 'url';
const root = path.dirname(fileURLToPath(import.meta.url));
/** @type {import('next').NextConfig} */
export default {
  serverExternalPackages: ['better-sqlite3', '@google-cloud/firestore'],
  output: 'standalone',
  // question bank and lessons are read from disk at runtime; make sure the standalone trace ships them
  outputFileTracingIncludes: { '/**': ['./data/questions_en.json', './data/syllabus_ja.json', './content/**/*'] },
  poweredByHeader: false,
  webpack: (config) => { config.resolve.alias['@'] = root; return config; },
};
