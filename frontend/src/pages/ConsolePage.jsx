import ServiceCard from '../components/ServiceCard'

export default function ConsolePage({ services, groups, start, stop }) {
  const grouped = groups.map((g) => ({
    ...g,
    items: services.filter((s) => s.group === g.id),
  }))
  const ungrouped = services.filter((s) => !groups.some((g) => g.id === s.group))

  return (
    <div className="space-y-10">
      {grouped.map(
        (g) =>
          g.items.length > 0 && (
            <section key={g.id}>
              <GroupHeader name={g.name} count={g.items.length} running={g.items.filter(s => s.status === 'running').length} />
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {g.items.map((svc) => (
                  <ServiceCard key={svc.id} service={svc} onStart={start} onStop={stop} />
                ))}
              </div>
            </section>
          )
      )}

      {ungrouped.length > 0 && (
        <section>
          <GroupHeader name="未分组" count={ungrouped.length} running={ungrouped.filter(s => s.status === 'running').length} />
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {ungrouped.map((svc) => (
              <ServiceCard key={svc.id} service={svc} onStart={start} onStop={stop} />
            ))}
          </div>
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

function GroupHeader({ name, count, running }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest">{name}</h2>
      <div className="flex-1 h-px bg-gradient-to-r from-border to-transparent" />
      <span className="text-[11px] text-slate-600">
        {running > 0 && <span className="text-emerald-500">{running} running</span>}
        {running > 0 && running < count && <span className="mx-1">/</span>}
        {running < count && <span>{count - running} stopped</span>}
      </span>
    </div>
  )
}
