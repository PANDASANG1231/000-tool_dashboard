import ServiceRow from '../components/ServiceRow'

export default function ConsolePage({ services, groups, start, stop }) {
  const grouped = groups.map((g) => ({
    ...g,
    items: services.filter((s) => s.group === g.id),
  }))
  const ungrouped = services.filter((s) => !groups.some((g) => g.id === s.group))

  return (
    <div className="space-y-8">
      {grouped.map(
        (g) =>
          g.items.length > 0 && (
            <section key={g.id}>
              <GroupHeader name={g.name} count={g.items.length} running={g.items.filter(s => s.status === 'running').length} />
              <ServiceTable services={g.items} onStart={start} onStop={stop} />
            </section>
          )
      )}

      {ungrouped.length > 0 && (
        <section>
          <GroupHeader name="未分组" count={ungrouped.length} running={ungrouped.filter(s => s.status === 'running').length} />
          <ServiceTable services={ungrouped} onStart={start} onStop={stop} />
        </section>
      )}

      {services.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 rounded-2xl bg-surface-1 border border-border flex items-center justify-center mb-5">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-slate-600">
              <rect x="2" y="3" width="20" height="14" rx="2" />
              <path d="M8 21h8" />
              <path d="M12 17v4" />
            </svg>
          </div>
          <p className="text-slate-400 text-sm font-medium mb-1">还没有配置任何服务</p>
          <p className="text-slate-600 text-xs">去「配置」页面添加你的第一个服务吧</p>
        </div>
      )}
    </div>
  )
}

function ServiceTable({ services, onStart, onStop }) {
  return (
    <div className="rounded-xl border border-border overflow-hidden bg-surface-1/30">
      <table className="w-full table-fixed">
        <colgroup>
          <col className="w-[40px]" />
          <col className="w-[18%]" />
          <col className="w-[10%]" />
          <col />
          <col className="w-[260px]" />
        </colgroup>
        <thead>
          <tr className="bg-surface-2/50 border-b border-border">
            <th className="py-2.5 text-center text-[10px] font-medium text-slate-600 uppercase tracking-wider"></th>
            <th className="py-2.5 px-4 text-left text-[10px] font-medium text-slate-600 uppercase tracking-wider">服务</th>
            <th className="py-2.5 px-4 text-left text-[10px] font-medium text-slate-600 uppercase tracking-wider">端口</th>
            <th className="py-2.5 px-4 text-left text-[10px] font-medium text-slate-600 uppercase tracking-wider">命令</th>
            <th className="py-2.5 px-4 text-right text-[10px] font-medium text-slate-600 uppercase tracking-wider">操作</th>
          </tr>
        </thead>
        <tbody>
          {services.map((svc) => (
            <ServiceRow key={svc.id} service={svc} onStart={onStart} onStop={onStop} />
          ))}
        </tbody>
      </table>
    </div>
  )
}

function GroupHeader({ name, count, running }) {
  const stopped = count - running
  return (
    <div className="flex items-center gap-3 mb-3 px-1">
      <h2 className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">{name}</h2>
      <div className="flex-1 h-px bg-gradient-to-r from-border/60 to-transparent" />
      <div className="flex items-center gap-2 text-[10px]">
        {running > 0 && (
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span className="text-emerald-500">{running}</span>
          </span>
        )}
        {stopped > 0 && (
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-600" />
            <span className="text-slate-600">{stopped}</span>
          </span>
        )}
      </div>
    </div>
  )
}
