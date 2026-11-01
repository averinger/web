import Database from 'better-sqlite3'
import { join } from 'node:path'

const DB_PATH = process.env.DB_PATH ?? join(import.meta.dirname, '..', 'data', 'app.db')

export const db = new Database(DB_PATH)
db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

// Утилиты для типизированных запросов
export function query<T>(sql: string, ...params: unknown[]): T[] {
  return db.prepare(sql).all(...params) as T[]
}

export function queryOne<T>(sql: string, ...params: unknown[]): T | undefined {
  return db.prepare(sql).get(...params) as T | undefined
}

export function run(sql: string, ...params: unknown[]) {
  return db.prepare(sql).run(...params)
}

export function transaction<T>(fn: () => T): T {
  return db.transaction(fn)()
}

// Грейсфул шатдаун
process.on('SIGINT', () => { db.close(); process.exit(0) })
process.on('SIGTERM', () => { db.close(); process.exit(0) })