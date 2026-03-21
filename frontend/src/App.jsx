import { useState } from 'react'
import { useServices } from './useServices'
import ConsolePage from './pages/ConsolePage'
import ConfigPage from './pages/ConfigPage'

export default function App() {
  const [page, setPage] = useState('console')
  const { services, groups, loading, refresh, start, stop, restart, setGroups } = useServices()

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
          <span className="text-slate-500 text-sm">Loading...</span>
        </div>
      </div>
    )
  }

  const runningCount = services.filter((s) => s.status === 'running').length

  return (
    <div className="min-h-screen bg-surface">
      {/* Header */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-surface/80 border-b border-border">
        <div className="max-w-6xl mx-auto px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="3" width="20" height="14" rx="2" />
                <path d="M8 21h8" />
                <path d="M12 17v4" />
              </svg>
            </div>
            <h1 className="text-base font-semibold text-white tracking-tight">Tool Dashboard</h1>
            {services.length > 0 && (
              <div className="hidden sm:flex items-center gap-2 ml-2 px-2.5 py-1 rounded-full bg-surface-1 border border-border">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span className="text-xs text-slate-400">
                  {runningCount}<span className="text-slate-600">/{services.length}</span>
                </span>
              </div>
            )}
          </div>

          <nav className="flex items-center bg-surface-1 rounded-lg p-1 border border-border">
            <NavBtn active={page === 'console'} onClick={() => setPage('console')}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1.5">
                <polyline points="4 17 10 11 4 5" />
                <line x1="12" y1="19" x2="20" y2="19" />
              </svg>
              控制台
            </NavBtn>
            <NavBtn active={page === 'config'} onClick={() => setPage('config')}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1.5">
                <circle cx="12" cy="12" r="3" />
                <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
              </svg>
              配置
            </NavBtn>
          </nav>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-6xl mx-auto px-8 py-8">
        {page === 'console' ? (
          <ConsolePage services={services} groups={groups} start={start} stop={stop} restart={restart} />
        ) : (
          <ConfigPage services={services} groups={groups} refresh={refresh} setGroups={setGroups} />
        )}
      </main>
    </div>
  )
}

function NavBtn({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center px-3.5 py-1.5 rounded-md text-xs font-medium transition-all duration-200 cursor-pointer ${
        active
          ? 'bg-accent text-white shadow-md shadow-accent/25'
          : 'text-slate-400 hover:text-slate-200'
      }`}
    >
      {children}
    </button>
  )
}
