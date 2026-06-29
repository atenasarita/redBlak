import React from 'react'
import EventTable from './components/EventTable'

export default function App() {
  return (
    <>
      <header className="header">
        <div className="logo">
          <div className="logo-mark">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
          </div>
          eventlog
        </div>
        <div className="live-indicator">
          <div className="live-dot" id="liveDot" />
          <span>Live</span>
        </div>
      </header>

      <main className="main">
        <EventTable />
      </main>
    </>
  )
}