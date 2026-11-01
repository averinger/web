import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { db, query, queryOne, run } from './db/index.js'

const app = new Hono()

app.use('*', logger())
app.use('*', cors())

// Health check (Fly.io будет пингать этот endpoint)
app.get('/health', (c) => c.json({ ok: true, ts: Date.now() }))

// --- API Routes ---
const api = app.basePath('/api')

// Users
api.post('/users', async (c) => {
  const { username, email, password_hash } = await c.req.json()
  if (!username || !email || !password_hash) {
    return c.json({ error: 'username, email, password_hash required' }, 400)
  }
  try {
    const result = run(
      'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)',
      username, email, password_hash
    )
    return c.json({ id: result.lastInsertRowid, username, email }, 201)
  } catch (e: any) {
    if (e.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return c.json({ error: 'username or email already exists' }, 409)
    }
    throw e
  }
})

api.get('/users/:id', (c) => {
  const user = queryOne<{ id: number; username: string; email: string; created_at: string }>(
    'SELECT id, username, email, created_at FROM users WHERE id = ?',
    c.req.param('id')
  )
  if (!user) return c.json({ error: 'not found' }, 404)
  return c.json(user)
})

api.get('/users', (c) => {
  const users = query<{ id: number; username: string; email: string; created_at: string }>(
    'SELECT id, username, email, created_at FROM users ORDER BY created_at DESC LIMIT 50'
  )
  return c.json(users)
})

// Posts
api.post('/posts', async (c) => {
  const { user_id, title, content } = await c.req.json()
  if (!user_id || !title || !content) {
    return c.json({ error: 'user_id, title, content required' }, 400)
  }
  const result = run(
    'INSERT INTO posts (user_id, title, content) VALUES (?, ?, ?)',
    user_id, title, content
  )
  return c.json({ id: result.lastInsertRowid, user_id, title, content }, 201)
})

api.get('/posts', (c) => {
  const posts = query<{ id: number; user_id: number; title: string; content: string; created_at: string }>(
    'SELECT id, user_id, title, content, created_at FROM posts ORDER BY created_at DESC LIMIT 50'
  )
  return c.json(posts)
})

api.get('/posts/:id', (c) => {
  const post = queryOne<{ id: number; user_id: number; title: string; content: string; created_at: string }>(
    'SELECT id, user_id, title, content, created_at FROM posts WHERE id = ?',
    c.req.param('id')
  )
  if (!post) return c.json({ error: 'not found' }, 404)
  return c.json(post)
})

// Static file serving для простого фронтенда (опционально)
app.get('*', (c) => c.text('GrandRP API 🚀 — see /health, /api/users, /api/posts'))

const port = Number(process.env.PORT) ?? 8080
console.log(`🚀 Server running on port ${port}`)

export default { fetch: app.fetch, port }