import { Router, Request, Response } from 'express'
import { pool, initDb } from '../db'
import { Event } from '../models/event'

const router = Router()

// In-memory fallback storage when no DATABASE_URL provided
const inMemory: Event[] = []

// initialize DB (if any)
initDb().catch(err => {
  console.error('db init failed:', err)
})

router.post('/', async (req: Request, res: Response) => {
  const body = req.body as Partial<Event>
  if (!body || !body.level || !body.message) {
    return res.status(400).json({ error: 'level and message are required' })
  }
  const evt: Event = {
    level: body.level,
    message: body.message,
    metadata: body.metadata ?? {},
    timestamp: body.timestamp ?? new Date().toISOString()
  }

  if (!pool) {
    // store in-memory
    evt.id = Date.now()
    inMemory.unshift(evt)
    return res.status(201).json(evt)
  }

  try {
    const q = 'INSERT INTO events (level, message, metadata, timestamp) VALUES ($1, $2, $3, $4) RETURNING id'
    const params = [evt.level, evt.message, evt.metadata, evt.timestamp]
    const r = await pool.query(q, params)
    evt.id = r.rows[0].id
    return res.status(201).json(evt)
  } catch (err) {
    console.error('insert error', err)
    return res.status(500).json({ error: 'failed to insert' })
  }
})

router.get('/', async (req: Request, res: Response) => {
  const limitQ = Number(req.query.limit ?? 50)
  const limit = Number.isNaN(limitQ) ? 50 : Math.min(limitQ, 100)
  const level = req.query.level as string | undefined

  if (!pool) {
    let results = inMemory.slice(0, limit)
    if (level) {
      results = results.filter(e => e.level === level)
    }
    return res.json(results)
  }

  try {
    let q = 'SELECT id, level, message, metadata, timestamp FROM events'
    const params: any[] = []
    if (level) {
      params.push(level)
      q += ' WHERE level = $1'
    }
    q += params.length ? ' ORDER BY timestamp DESC LIMIT $2' : ' ORDER BY timestamp DESC LIMIT $1'
    params.push(limit)
    const r = await pool.query(q, params)
    return res.json(r.rows)
  } catch (err) {
    console.error('query error', err)
    return res.status(500).json({ error: 'failed to query' })
  }
})

export default router