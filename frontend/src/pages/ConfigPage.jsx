import { useState } from 'react'
import { api } from '../api'

const empty = { name: '', group: '', command: '', workDir: '', env: {}, port: '', frontendUrl: '', autoStart: false }

export default function ConfigPage({ services, groups, refresh, setGroups }) {
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(empty)
  const [envText, setEnvText] = useState('')
  const [groupInput, setGroupInput] = useState('')

  const openNew = () => {
    setForm(empty)
    setEnvText('')
    setEditing('new')
  }

  const openEdit = (svc) => {
    setForm({
      name: svc.name,
      group: svc.group,
      command: svc.command,
      workDir: svc.workDir || '',
      port: svc.port || '',
      frontendUrl: svc.frontendUrl || '',
      autoStart: svc.autoStart || false,
    })
    setEnvText(
      Object.entries(svc.env || {})
        .map(([k, v]) => `${k}=${v}`)
        .join('\n')
    )
    setEditing(svc.id)
  }

  const parseEnv = (text) => {
    const env = {}
    text.split('\n').forEach((line) => {
      const i = line.indexOf('=')
      if (i > 0) env[line.slice(0, i).trim()] = line.slice(i + 1).trim()
    })
    return env
  }

  const save = async () => {
    const payload = {
      ...form,
      port: form.port ? Number(form.port) : null,
      frontendUrl: form.frontendUrl || null,
      env: parseEnv(envText),
      autoStart: form.autoStart,
    }
    if (editing === 'new') {
      await api.createService(payload)
    } else {
      await api.updateService(editing, payload)
    }
    setEditing(null)
    refresh()
  }

  const remove = async (id) => {
    await api.deleteService(id)
    refresh()
  }

  const addGroup = async () => {
    if (!groupInput.trim()) return
    const id = groupInput.trim().toLowerCase().replace(/\s+/g, '-')
    const updated = [...groups, { id, name: groupInput.trim() }]
    await api.updateGroups(updated)
    setGroups(updated)
    setGroupInput('')
  }

  const removeGroup = async (gid) => {
    const updated = groups.filter((g) => g.id !== gid)
    await api.updateGroups(updated)
    setGroups(updated)
  }

  return (
    <div className="space-y-10">
      {/* Groups */}
      <section>
        <SectionHeader title="分组管理" subtitle="对服务进行分类，方便在控制台中查看" />
        <div className="bg-surface-1 rounded-xl border border-border p-5">
          <div className="flex flex-wrap gap-2 mb-4">
            {groups.map((g) => (
              <span
                key={g.id}
                className="group/tag inline-flex items-center gap-2 pl-3 pr-2 py-1.5 bg-surface-2 border border-border rounded-lg text-sm text-slate-300"
              >
                {g.name}
                <button
                  onClick={() => removeGroup(g.id)}
                  className="w-5 h-5 rounded-md flex items-center justify-center text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
                </button>
              </span>
            ))}
            {groups.length === 0 && (
              <span className="text-xs text-slate-600 italic">暂无分组</span>
            )}
          </div>
          <div className="flex gap-2">
            <input
              value={groupInput}
              onChange={(e) => setGroupInput(e.target.value)}
              placeholder="输入新分组名称..."
              className="flex-1 px-3 py-2 bg-surface border border-border rounded-lg text-sm text-white placeholder-slate-600 focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20 transition-all"
              onKeyDown={(e) => e.key === 'Enter' && addGroup()}
            />
            <button
              onClick={addGroup}
              className="px-4 py-2 text-sm font-medium bg-accent/10 hover:bg-accent/20 text-blue-400 border border-accent/20 rounded-lg transition-all cursor-pointer"
            >
              添加
            </button>
          </div>
        </div>
      </section>

      {/* Services */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <SectionHeader title="服务列表" subtitle={`共 ${services.length} 个服务`} noMargin />
          <button
            onClick={openNew}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-accent hover:bg-blue-600 text-white rounded-lg shadow-md shadow-accent/20 transition-all cursor-pointer"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg>
            添加服务
          </button>
        </div>

        <div className="space-y-2">
          {services.map((svc) => (
            <div
              key={svc.id}
              className="group flex items-center justify-between bg-surface-1 border border-border hover:border-border-light rounded-xl px-5 py-4 transition-all"
            >
              <div className="flex items-center gap-4 min-w-0">
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${svc.status === 'running' ? 'bg-emerald-400' : 'bg-slate-600'}`} />
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-white">{svc.name}</span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] text-slate-500 bg-surface-2 border border-border">
                      {groups.find(g => g.id === svc.group)?.name || '未分组'}
                    </span>
                    {svc.autoStart && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-medium text-amber-400/80 bg-amber-500/10 border border-amber-500/20">
                        自启
                      </span>
                    )}
                  </div>
                  <code className="text-[11px] text-slate-500 font-mono block truncate mt-0.5">{svc.command}</code>
                </div>
              </div>
              <div className="flex gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => openEdit(svc)}
                  className="p-2 text-slate-400 hover:text-white hover:bg-surface-3 rounded-lg transition-all cursor-pointer"
                  title="编辑"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                </button>
                <button
                  onClick={() => remove(svc.id)}
                  className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all cursor-pointer"
                  title="删除"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  </svg>
                </button>
              </div>
            </div>
          ))}

          {services.length === 0 && (
            <div className="text-center py-12 text-slate-600 text-sm">
              点击「添加服务」开始配置
            </div>
          )}
        </div>
      </section>

      {/* Modal */}
      {editing !== null && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-surface-1 border border-border rounded-2xl w-full max-w-lg shadow-2xl shadow-black/50 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h3 className="text-base font-semibold text-white">
                {editing === 'new' ? '添加服务' : '编辑服务'}
              </h3>
              <button
                onClick={() => setEditing(null)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-white hover:bg-surface-3 transition-all cursor-pointer"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            </div>

            <div className="px-6 py-5 space-y-4 max-h-[65vh] overflow-y-auto">
              <Field label="服务名称" value={form.name} onChange={(v) => setForm({ ...form, name: v })} placeholder="如 MCP Filesystem" />
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">所属分组</label>
                <select
                  value={form.group}
                  onChange={(e) => setForm({ ...form, group: e.target.value })}
                  className="w-full px-3 py-2.5 bg-surface border border-border rounded-lg text-sm text-white focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20 transition-all"
                >
                  <option value="">未分组</option>
                  {groups.map((g) => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">启动命令</label>
                <textarea
                  value={form.command}
                  onChange={(e) => setForm({ ...form, command: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2.5 bg-surface border border-border rounded-lg text-sm text-white font-mono focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20 transition-all resize-none"
                  placeholder={"npm install\nnpm run dev"}
                />
                <p className="text-[11px] text-slate-600 mt-1">支持多行，每行按顺序执行</p>
              </div>
              <Field label="工作目录" value={form.workDir} onChange={(v) => setForm({ ...form, workDir: v })} placeholder="可选，默认为当前目录" mono />
              <div className="grid grid-cols-2 gap-3">
                <Field label="端口号" value={form.port} onChange={(v) => setForm({ ...form, port: v })} placeholder="可选" />
                <Field label="前端地址" value={form.frontendUrl} onChange={(v) => setForm({ ...form, frontendUrl: v })} placeholder="http://localhost:..." />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">环境变量</label>
                <textarea
                  value={envText}
                  onChange={(e) => setEnvText(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2.5 bg-surface border border-border rounded-lg text-sm text-white font-mono focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20 transition-all resize-none"
                  placeholder={"KEY=VALUE\nNODE_ENV=development"}
                />
                <p className="text-[11px] text-slate-600 mt-1">每行一个，格式: KEY=VALUE</p>
              </div>
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-xs font-medium text-slate-400">自动启动</p>
                  <p className="text-[11px] text-slate-600 mt-0.5">Dashboard 启动时自动运行此服务</p>
                </div>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, autoStart: !form.autoStart })}
                  className={`relative w-10 h-5 rounded-full transition-colors cursor-pointer ${form.autoStart ? 'bg-amber-500/70' : 'bg-surface-3 border border-border'}`}
                >
                  <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${form.autoStart ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </button>
              </div>
            </div>

            <div className="flex justify-end gap-2 px-6 py-4 border-t border-border bg-surface/50">
              <button
                onClick={() => setEditing(null)}
                className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-white bg-surface-2 hover:bg-surface-3 border border-border rounded-lg transition-all cursor-pointer"
              >
                取消
              </button>
              <button
                onClick={save}
                className="px-5 py-2 text-sm font-medium bg-accent hover:bg-blue-600 text-white rounded-lg shadow-md shadow-accent/20 transition-all cursor-pointer"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function SectionHeader({ title, subtitle, noMargin }) {
  return (
    <div className={noMargin ? '' : 'mb-4'}>
      <h2 className="text-sm font-semibold text-white">{title}</h2>
      {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
    </div>
  )
}

function Field({ label, value, onChange, placeholder, mono }) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-400 mb-1.5">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full px-3 py-2.5 bg-surface border border-border rounded-lg text-sm text-white placeholder-slate-600 focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20 transition-all ${mono ? 'font-mono' : ''}`}
      />
    </div>
  )
}
