import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

let db: Database.Database | null = null;
export function getDb(): Database.Database {
  if (db) return db;
  const file = process.env.CCAR_DB || path.join(process.cwd(), 'data', 'app.db');
  if (file !== ':memory:') fs.mkdirSync(path.dirname(file), { recursive: true });
  db = new Database(file);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  db.exec(`
  CREATE TABLE IF NOT EXISTS users(id INTEGER PRIMARY KEY, email TEXT UNIQUE NOT NULL, pw_hash TEXT NOT NULL, created_at INTEGER NOT NULL);
  CREATE TABLE IF NOT EXISTS sessions(token_hash TEXT PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, expires_at INTEGER NOT NULL);
  CREATE TABLE IF NOT EXISTS attempts(id INTEGER PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, question_num INTEGER NOT NULL, selected TEXT NOT NULL, is_correct INTEGER NOT NULL, ms INTEGER, mode TEXT, created_at INTEGER NOT NULL);
  CREATE INDEX IF NOT EXISTS idx_attempts_user ON attempts(user_id, created_at);
  CREATE TABLE IF NOT EXISTS progress(user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, question_num INTEGER NOT NULL, attempts INTEGER NOT NULL, correct INTEGER NOT NULL, streak_wrong INTEGER NOT NULL, box INTEGER NOT NULL, last_at INTEGER, due_at INTEGER, PRIMARY KEY(user_id, question_num));
  CREATE TABLE IF NOT EXISTS bookmarks(user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, question_num INTEGER NOT NULL, created_at INTEGER NOT NULL, PRIMARY KEY(user_id, question_num));
  CREATE TABLE IF NOT EXISTS lesson_progress(user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, ts_id TEXT NOT NULL, status TEXT NOT NULL, updated_at INTEGER NOT NULL, PRIMARY KEY(user_id, ts_id));
  CREATE TABLE IF NOT EXISTS exams(id INTEGER PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, nums TEXT NOT NULL, started_at INTEGER NOT NULL, submitted_at INTEGER, result TEXT);
  CREATE TABLE IF NOT EXISTS settings(user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE, json TEXT NOT NULL);
  `);
  return db;
}
