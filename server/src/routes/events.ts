import { Router, Request, Response } from 'express'
import { pool, initDb } from '../db'
import { Event } from '../models/event'
import { logger } from '../utils/logger'


const router = Router()

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
    return res.status(500).json({ error: "DB no configurado" })
    }

  try {
    const q = 'INSERT INTO events (level, message, metadata, timestamp) VALUES ($1, $2, $3, $4) RETURNING id'
    const params = [evt.level, evt.message, evt.metadata, evt.timestamp]
    const r = await pool.query(q, params)
    evt.id = r.rows[0].id

    logger.info('Nuevo evento creado', evt)

    return res.status(201).json(evt)

  } catch (err) {
    console.error('insert error', err)
    logger.error('Error al insertar', err)

    return res.status(500).json({ error: 'failed to insert' })
  }
})

router.get('/', async (req: Request, res: Response) => {
  const limitQ = Number(req.query.limit ?? 50)
  const limit = Number.isNaN(limitQ) ? 50 : Math.min(limitQ, 100)
  const level = req.query.level as string | undefined

    if (!pool) {
        return res.status(500).json({ error: "DB no configurado" })
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
    logger.error('Query failed', err)

  return res.status(500).json({
    error: 'failed to query'
  })
}
})

export default router