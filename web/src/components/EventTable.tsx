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
  if (diff < 60)    return `Hace ${Math.round(diff)}s`
  if (diff < 3600)  return `Hace ${Math.round(diff / 60)}m`
  if (diff < 86400) return `Hace ${Math.round(diff / 3600)}h`
  return new Date(iso).toLocaleDateString()
}

function pageRange(cur: number, total: number): (number | '…')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  if (cur <= 4)   return [1, 2, 3, 4, 5, '…', total]
  if (cur >= total - 3) return [1, '…', total - 4, total - 3, total - 2, total - 1, total]
  return [1, '…', cur - 1, cur, cur + 1, '…', total]
}

function LevelBadge({ level }: { level: string }) {
  const normalized = normLevel(level)
  return <span className={`level-badge ${normalized}`}>{normalized}</span>
}

function EventModal({ event, onClose }: { event: Event; onClose: () => void }) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  const meta = (event as Record<string, unknown>).metadata
  const src = event.source || event.service

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal">
        <div className="modal-header">
          <h2>Event detail</h2>
          <button className="btn-close" onClick={onClose} aria-label="Close">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <line x1={18} y1={6} x2={6} y2={18} />
              <line x1={6} y1={6} x2={18} y2={18} />
            </svg>
          </button>
        </div>
        <div className="modal-body">
          <div className="detail-row">
            <span className="detail-label">Nivel</span>
            <span className="detail-value"><LevelBadge level={event.level} /></span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Mensaje</span>
            <span className="detail-value">{event.message}</span>
          </div>
          {src && (
            <div className="detail-row">
              <span className="detail-label">Fuente</span>
              <span className="detail-value">{src}</span>
            </div>
          )}
          {event.id != null && (
            <div className="detail-row">
              <span className="detail-label">ID</span>
              <span className="detail-value">{String(event.id)}</span>
            </div>
          )}
          <div className="detail-row">
            <span className="detail-label">Hora</span>
            <span className="detail-value">{new Date(event.timestamp).toLocaleString()}</span>
          </div>
          {meta != null && (
            <div className="detail-row" style={{ flexDirection: 'column', gap: 6 }}>
              <span className="detail-label">Metadata</span>
              <pre className="detail-meta">
                {typeof meta === 'object' ? JSON.stringify(meta, null, 2) : String(meta)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function EventTable() {
  const [allEvents, setAllEvents]   = useState<Event[]>([])
  const [status, setStatus]         = useState<LiveStatus>('conectando')
  const [levelFilter, setLevelFilter] = useState<LevelFilter>('todos')
  const [search, setSearch]         = useState('')
  const [page, setPage]             = useState(1)
  const [spinning, setSpinning]     = useState(false)
  const [selected, setSelected]     = useState<Event | null>(null)

  const load = useCallback(async () => {
    setSpinning(true)
    setStatus('conectando')
    try {
      const res = await fetch('/events')
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = await res.json()
      const data: Event[] = Array.isArray(json) ? json : (json.events ?? json.data ?? [])
      data.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      setAllEvents(data)
      setStatus('en vivo')
    } catch {
      setStatus('desconectado')
    } finally {
      setSpinning(false)
    }
  }, [])

  useEffect(() => {
    load()
    const interval = setInterval(load, 30_000)
    return () => clearInterval(interval)
  }, [load])

  const counts = { error: 0, advertencia: 0, informacion: 0, debug: 0 }
  for (const ev of allEvents) {
    const l = normLevel(ev.level)
    if (l in counts) counts[l as keyof typeof counts]++
  }

  const filtered = allEvents.filter(ev => {
    const l   = normLevel(ev.level)
    const msg = (ev.message ?? '').toLowerCase()
    const src = (ev.source ?? ev.service ?? '').toLowerCase()
    const matchLevel  = levelFilter === 'todos' || l === levelFilter
    const matchSearch = !search || msg.includes(search) || src.includes(search)
    return matchLevel && matchSearch
  })

  const totalPages  = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage    = Math.min(page, totalPages)
  const pageSlice   = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)
  const start       = (safePage - 1) * PAGE_SIZE + 1
  const end         = Math.min(safePage * PAGE_SIZE, filtered.length)

  function handleLevelFilter(l: LevelFilter) {
    setLevelFilter(l)
    setPage(1)
  }

  function handleSearch(e: React.ChangeEvent<HTMLInputElement>) {
    setSearch(e.target.value.toLowerCase())
    setPage(1)
  }

  return (
    <>
      {/* Stats */}
      <div className="stats">
        <div className="stat-card" key="error">
          <div className="stat-label">Errores</div>
          <div className="stat-value">{counts.error}</div>
        </div>
        <div className="stat-card" key="advertencia">
          <div className="stat-label">Advertencias</div>
          <div className="stat-value">{counts.advertencia}</div>
        </div>
        <div className="stat-card" key="informacion">
          <div className="stat-label">Información</div>
          <div className="stat-value">{counts.informacion}</div>
        </div>
        <div className="stat-card" key="debug">
          <div className="stat-label">Debug</div>
          <div className="stat-value">{counts.debug}</div>
        </div>
      </div>

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
              {l.charAt(0).toUpperCase() + l.slice(1)}
            </button>
          ))}
        </div>

        <div className="search-wrap">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <circle cx={11} cy={11} r={8} />
            <line x1={21} y1={21} x2={16.65} y2={16.65} />
          </svg>
          <input
            className="search-input"
            placeholder="Buscar mensaje o fuente"
            onChange={handleSearch}
          />
        </div>

        <button className={`btn-refresh${spinning ? ' spinning' : ''}`} onClick={load}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
            <polyline points="23 4 23 10 17 10" />
            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
          </svg>
          Actualizar
        </button>
      </div>

      {/* Table */}
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th style={{ width: 90 }}>Nivel</th>
              <th>Mensaje</th>
              <th className="col-source">Fuente</th>
              <th style={{ width: 110 }}>Hora</th>
            </tr>
          </thead>
          <tbody>
            {pageSlice.map((ev, i) => (
              <tr key={ev.id ?? i} onClick={() => setSelected(ev)}>
                <td><LevelBadge level={ev.level} /></td>
                <td><div className="event-msg">{ev.message}</div></td>
                <td className="col-source cell-mono">{ev.source ?? ev.service ?? '—'}</td>
                <td className="cell-mono">{relativeTime(ev.timestamp)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <div className="empty-state">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
              <rect x={3} y={3} width={18} height={18} rx={2} />
              <line x1={3} y1={9} x2={21} y2={9} />
              <line x1={9} y1={21} x2={9} y2={9} />
            </svg>
            <strong>No hay eventos registrados</strong>
            <p>Ajusta los filtros para poder mostrar información.</p>
          </div>
        )}

        {/* Pagination */}
        <div className="pagination">
          <span className="page-info">
            {filtered.length === 0 ? '0 resultados' : `${start}–${end} de ${filtered.length}`}
          </span>
          <div className="page-btns">
            <button className="btn-page" disabled={safePage === 1} onClick={() => setPage(p => p - 1)}>←</button>
            {pageRange(safePage, totalPages).map((p, i) =>
              p === '…'
                ? <button key={`e${i}`} className="btn-page" disabled>…</button>
                : <button key={p} className={`btn-page${p === safePage ? ' active' : ''}`} onClick={() => setPage(p)}>{p}</button>
            )}
            <button className="btn-page" disabled={safePage === totalPages} onClick={() => setPage(p => p + 1)}>→</button>
          </div>
        </div>
      </div>

      {/* Modal */}
      {selected && <EventModal event={selected} onClose={() => setSelected(null)} />}
    </>
  )
}