import { Pool } from 'pg'

const DATABASE_URL = process.env.DATABASE_URL ?? ''

export let pool: Pool | null = null

export async function initDb() {
  if (!DATABASE_URL) {
    console.warn('DATABASE_URL not set — running with in-memory fallback')
    pool = null
    return
  }
  pool = new Pool({ connectionString: DATABASE_URL })
  await ensureSchema()
}

async function ensureSchema() {
  if (!pool) return
  const q = `CREATE TABLE IF NOT EXISTS events (
    id BIGSERIAL PRIMARY KEY,
    level TEXT,
    message TEXT,
    metadata JSONB,
    timestamp timestamptz DEFAULT now()
  )`
  await pool.query(q)
}