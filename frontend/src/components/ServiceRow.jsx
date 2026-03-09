import { useState, useRef, useEffect } from 'react'

export default function ServiceRow({ service, onStart, onStop }) {
  const [showLogs, setShowLogs] = useState(false)
  const logRef = useRef(null)
  const running = service.status === 'running'
  const starting = service.status === 'starting'

  useEffect(() => {
    if (showLogs && logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight
    }
  }, [showLogs, service.logs])

  const url = service.frontendUrl || (service.port ? `http://localhost:${service.port}` : null)

  return (
    <>
      <tr
        className={`border-b transition-colors duration-200 ${
          running
            ? 'border-emerald-500/10 bg-emerald-500/[0.03]'
            : starting
              ? 'border-amber-500/10 bg-amber-500/[0.03]'
              : 'border-border hover:bg-surface-1/50'
        }`}
      >
        {/* Status dot */}
        <td className="pl-4 pr-2 py-3 w-10">
          <span
            className={`block w-2.5 h-2.5 rounded-full transition-colors ${
              running ? 'bg-emerald-400 status-running' : starting ? 'bg-amber-400 animate-pulse' : 'bg-slate-600'
            }`}
          />
        </td>

        {/* Service name */}
        <td className="px-3 py-3">
          <span className="text-sm font-semibold text-white">{service.name}</span>
        </td>

        {/* Port / URL */}
        <td className="px-3 py-3">
          {url ? (
            <a
              href={url}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-slate-500 hover:text-blue-400 font-mono transition-colors underline decoration-slate-700 hover:decoration-blue-400"
            >
              {service.port ? `localhost:${service.port}` : url}
            </a>
          ) : (
            <span className="text-xs text-slate-600">—</span>
          )}
        </td>

        {/* Command */}
        <td className="px-3 py-3 max-w-[260px]">
          <code className="text-[11px] text-slate-500 font-mono block truncate">{service.command}</code>
        </td>

        {/* Actions */}
        <td className="px-3 py-3 text-right">
          <div className="flex items-center justify-end gap-1.5">
            {running ? (
              <button
                onClick={() => onStop(service.id)}
                className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-md transition-all cursor-pointer"
              >
                <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="6" width="12" height="12" rx="1" /></svg>
                停止
              </button>
            ) : starting ? (
              <button
                disabled
                className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-md opacity-70 cursor-not-allowed"
              >
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="animate-spin"><circle cx="12" cy="12" r="10" strokeDasharray="31.4 31.4" /></svg>
                启动中
              </button>
            ) : (
              <button
                onClick={() => onStart(service.id)}
                className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 rounded-md transition-all cursor-pointer"
              >
                <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3" /></svg>
                启动
              </button>
            )}

            {running && service.frontendUrl && (
              <a
                href={service.frontendUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium bg-accent/10 hover:bg-accent/20 text-blue-400 border border-accent/20 rounded-md transition-all"
              >
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                  <polyline points="15 3 21 3 21 9" />
                  <line x1="10" y1="14" x2="21" y2="3" />
                </svg>
                打开
              </a>
            )}

            <button
              onClick={() => setShowLogs(!showLogs)}
              className={`flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium rounded-md transition-all cursor-pointer ${
                showLogs
                  ? 'bg-slate-500/15 text-slate-300 border border-slate-500/20'
                  : 'text-slate-500 hover:text-slate-300 border border-transparent hover:border-border-light'
              }`}
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
              </svg>
              日志
            </button>
          </div>
        </td>
      </tr>

      {/* Expandable log row */}
      {showLogs && (
        <tr className="border-b border-border">
          <td colSpan={5} className="p-0">
            <div
              ref={logRef}
              className="log-container px-6 py-4 max-h-52 overflow-y-auto font-mono text-[11px] leading-relaxed text-slate-500 whitespace-pre-wrap bg-[#060a12]"
            >
              {service.logs?.length ? service.logs.join('') : (
                <span className="text-slate-600 italic">暂无日志输出...</span>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  )
}
