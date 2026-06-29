import React, { useEffect, useState, useCallback } from 'react'

type Event = {
  id?: number | string
  level: string
  message: string
  timestamp: string
  source?: string
  service?: string
  metadata?: unknown
}

type LiveStatus = 'en vivo' | 'conectando' | 'desconectado'

const PAGE_SIZE = 20
const LEVELS = ['todos', 'error', 'advertencia', 'informacion', 'debug'] as const
type LevelFilter = typeof LEVELS[number]

function normLevel(raw: string): string {
  const l = raw.toLowerCase()
  if (l === 'warning') return 'advertencia'
  if (l === 'info') return 'informacion'
  return l
}

function relativeTime(iso: string): string {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000
  if (diff < 60) return `Hace ${Math.round(diff)}s`
  if (diff < 3600) return `Hace ${Math.round(diff / 60)}m`
  if (diff < 86400) return `Hace ${Math.round(diff / 3600)}h`
  return new Date(iso).toLocaleDateString()
}

export default function EventTable() {
  const [events, setEvents] = useState<Event[]>([])
  const [status, setStatus] = useState<LiveStatus>('conectando')
  const [levelFilter, setLevelFilter] = useState<LevelFilter>('todos')
  const [page, setPage] = useState(1)
  const [spinning, setSpinning] = useState(false)

  const load = useCallback(async () => {
    setSpinning(true)
    setStatus('conectando')

    try {
      const offset = (page - 1) * PAGE_SIZE

      const res = await fetch(
        `http://localhost:8000/events?limit=${PAGE_SIZE}&offset=${offset}${
          levelFilter === 'todos' ? '' : `&level=${levelFilter}`
        }`
      )

      if (!res.ok) throw new Error(`HTTP ${res.status}`)

      const json = await res.json()

      const data: Event[] = json.data ?? json

      setEvents(data)
      setStatus('en vivo')
    } catch {
      setStatus('desconectado')
    } finally {
      setSpinning(false)
    }
  }, [page, levelFilter])

  useEffect(() => {
    load()
  }, [load])

  function handleLevelFilter(l: LevelFilter) {
    setLevelFilter(l)
    setPage(1)
  }

  return (
    <>

      {/* Toolbar */}
      <div className="toolbar">
        <span className="toolbar-title">Events</span>

        <div className="filter-group">
          {LEVELS.map(l => (
            <button
              key={l}
              className={`btn-filter${levelFilter === l ? ' active' : ''}`}
              onClick={() => handleLevelFilter(l)}
            >
              {l}
            </button>
          ))}
        </div>

        <button className={`btn-refresh${spinning ? ' spinning' : ''}`} onClick={load}>
          Actualizar
        </button>
      </div>

      {/* Table */}
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Nivel</th>
              <th>Mensaje</th>
              <th>Fuente</th>
              <th>Hora</th>
            </tr>
          </thead>

          <tbody>
            {events.map((ev, i) => (
              <tr key={ev.id ?? i}>
                <td>{normLevel(ev.level)}</td>
                <td>{ev.message}</td>
                <td>{ev.source ?? ev.service ?? '—'}</td>
                <td>{relativeTime(ev.timestamp)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {events.length === 0 && (
          <div className="empty-state">
            No hay eventos
          </div>
        )}

        {/* Pagination */}
        <div className="pagination">
          <button
            className="btn-page"
            disabled={page === 1}
            onClick={() => setPage(p => p - 1)}
          >
            ←
          </button>

          <span>Página {page}</span>

          <button
            className="btn-page"
            disabled={events.length < PAGE_SIZE}
            onClick={() => setPage(p => p + 1)}
          >
            →
          </button>
        </div>
      </div>
    </>
  )
}

