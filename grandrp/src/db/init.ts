import Database from 'better-sqlite3'
import { join } from 'node:path'

// Путь к БД на Fly Volume (см. fly.toml → [mounts])
const DB_PATH = process.env.DB_PATH ?? join(import.meta.dirname, '..', 'data', 'app.db')

const db = new Database(DB_PATH)

// WAL mode — безопаснее для конкурентных чтений/записей
db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

// Схема
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE INDEX IF NOT EXISTS idx_posts_user ON posts(user_id);
  CREATE INDEX IF NOT EXISTS idx_posts_created ON posts(created_at DESC);
`)

console.log('✅ Database initialized at', DB_PATH)
db.close()