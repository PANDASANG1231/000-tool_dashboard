import { useState, useRef, useEffect } from 'react'

export default function ServiceCard({ service, onStart, onStop }) {
  const [showLogs, setShowLogs] = useState(false)
  const logRef = useRef(null)
  const running = service.status === 'running'
  const starting = service.status === 'starting'

  useEffect(() => {
    if (showLogs && logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight
    }
  }, [showLogs, service.logs])

  return (
    <div
      className={`group relative rounded-xl border transition-all duration-300 ${
        running
          ? 'bg-surface-2/80 border-emerald-500/20 shadow-lg shadow-emerald-500/5'
          : starting
            ? 'bg-surface-2/80 border-amber-500/20 shadow-lg shadow-amber-500/5'
            : 'bg-surface-1 border-border hover:border-border-light'
      }`}
    >
      {/* Top accent line */}
      <div
        className={`absolute top-0 left-4 right-4 h-px transition-colors duration-300 ${
          running
            ? 'bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent'
            : starting
              ? 'bg-gradient-to-r from-transparent via-amber-500/50 to-transparent'
              : 'bg-transparent'
        }`}
      />

      <div className="p-5">
        {/* Header row */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="relative">
              <span
                className={`block w-2.5 h-2.5 rounded-full transition-colors ${
                  running ? 'bg-emerald-400 status-running' : starting ? 'bg-amber-400 animate-pulse' : 'bg-slate-600'
                }`}
              />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white leading-tight">{service.name}</h3>
              {service.port && (
                <a
                  href={service.frontendUrl || `http://localhost:${service.port}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] text-slate-500 hover:text-blue-400 font-mono transition-colors underline decoration-slate-700 hover:decoration-blue-400"
                >
                  localhost:{service.port}
                </a>
              )}
            </div>
          </div>

          {/* Status badge */}
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-medium tracking-wide uppercase ${
              running
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                : starting
                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                  : 'bg-slate-500/10 text-slate-500 border border-slate-500/10'
            }`}
          >
            {running ? 'Running' : starting ? 'Starting' : 'Stopped'}
          </span>
        </div>

        {/* Command preview */}
        <div className="mb-4 px-3 py-2 bg-surface/60 rounded-lg border border-border/50">
          <code className="text-[11px] text-slate-400 font-mono block truncate">{service.command}</code>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {running ? (
            <button
              onClick={() => onStop(service.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-lg transition-all cursor-pointer"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="6" width="12" height="12" rx="1" /></svg>
              停止
            </button>
          ) : starting ? (
            <button
              disabled
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-lg opacity-70 cursor-not-allowed"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="animate-spin"><circle cx="12" cy="12" r="10" strokeDasharray="31.4 31.4" /></svg>
              启动中...
            </button>
          ) : (
            <button
              onClick={() => onStart(service.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 rounded-lg transition-all cursor-pointer"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3" /></svg>
              启动
            </button>
          )}

          {running && service.frontendUrl && (
            <a
              href={service.frontendUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-accent/10 hover:bg-accent/20 text-blue-400 border border-accent/20 rounded-lg transition-all"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
              打开
            </a>
          )}

          <button
            onClick={() => setShowLogs(!showLogs)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all cursor-pointer ml-auto ${
              showLogs
                ? 'bg-slate-500/15 text-slate-300 border border-slate-500/20'
                : 'text-slate-500 hover:text-slate-300 border border-transparent hover:border-border-light'
            }`}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
            </svg>
            日志
          </button>
        </div>
      </div>

      {/* Log panel */}
      {showLogs && (
        <div className="border-t border-border">
          <div
            ref={logRef}
            className="log-container p-4 max-h-52 overflow-y-auto font-mono text-[11px] leading-relaxed text-slate-500 whitespace-pre-wrap bg-[#060a12]"
          >
            {service.logs?.length ? service.logs.join('') : (
              <span className="text-slate-600 italic">暂无日志输出...</span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
