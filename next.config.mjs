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
  webpack: (config, { isServer }) => {
    config.resolve.alias['@'] = root;
    // better-sqlite3 is an optional dependency (local dev only; production uses Firestore and does not install it).
    // Declare it external up front so the build does not try to resolve it when it is absent.
    if (isServer) config.externals.push(({ request }, cb) => (request === 'better-sqlite3' ? cb(null, 'commonjs better-sqlite3') : cb()));
    return config;
  },
};
