import express from 'express'
import cors from 'cors'
import { createServer } from 'http'
import { WebSocketServer } from 'ws'
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { spawn, execSync } from 'child_process'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DATA_FILE = join(__dirname, 'services.json')
const PORT = 3456
const EXTENDED_PATH = `/opt/homebrew/bin:/usr/local/bin:${process.env.PATH}`
const shellEnv = { ...process.env, PATH: EXTENDED_PATH }

// --- State ---
const processes = new Map() // id -> { proc, logs: string[], externalPid?: number }
const wsClients = new Set()

function loadData() {
  return JSON.parse(readFileSync(DATA_FILE, 'utf-8'))
}

function saveData(data) {
  writeFileSync(DATA_FILE, JSON.stringify(data, null, 2))
}

function broadcast(msg) {
  const str = JSON.stringify(msg)
  for (const ws of wsClients) {
    if (ws.readyState === 1) ws.send(str)
  }
}

function getStatus(id) {
  const entry = processes.get(id)
  if (!entry) return 'stopped'
  // External process (detected but not spawned by us)
  if (entry.externalPid) {
    if (entry.externalPid === -1) return 'running' // docker containers
    try {
      process.kill(entry.externalPid, 0) // signal 0 = check if alive
      return 'running'
    } catch {
      processes.delete(id)
      return 'stopped'
    }
  }
  if (entry.proc.exitCode !== null) return 'stopped'
  return 'running'
}

// Check if a service is already running externally
function detectExternalProcess(svc) {
  try {
    if (isDockerService(svc) && svc.workDir) {
      // For docker compose: check if containers are running
      const out = execSync('docker compose ps --status running -q', {
        cwd: svc.workDir, encoding: 'utf-8', timeout: 5000, env: shellEnv, stdio: ['pipe', 'pipe', 'pipe'],
      }).trim()
      if (out) return { containerIds: out.split('\n') }
    } else {
      // For regular processes: extract the main binary and pgrep for it
      const cmd = svc.command.split('&&').pop().trim().split('|').pop().trim()
      const binary = cmd.split(/\s+/)[0].replace(/^\.\//, '')
      if (!binary) return null
      const pid = execSync(`pgrep -f "${binary}"`, {
        encoding: 'utf-8', timeout: 3000, env: shellEnv, stdio: ['pipe', 'pipe', 'pipe'],
      }).trim().split('\n')[0]
      if (pid) return { pid: parseInt(pid, 10) }
    }
  } catch { /* not running */ }
  return null
}

function buildServiceResponse(svc) {
  // Auto-detect external processes if we don't have one tracked
  if (!processes.has(svc.id) || getStatus(svc.id) === 'stopped') {
    const ext = detectExternalProcess(svc)
    if (ext && ext.pid) {
      processes.set(svc.id, { proc: null, logs: ['[Detected externally running process, PID: ' + ext.pid + ']\n'], externalPid: ext.pid })
    } else if (ext && ext.containerIds) {
      processes.set(svc.id, { proc: null, logs: ['[Detected running Docker containers]\n'], externalPid: -1, containerIds: ext.containerIds })
    }
  }
  const entry = processes.get(svc.id)
  return {
    ...svc,
    status: getStatus(svc.id),
    logs: entry ? entry.logs : [],
  }
}

// --- Express ---
const app = express()
app.use(cors())
app.use(express.json())

// List all services with status
app.get('/api/services', (_req, res) => {
  const data = loadData()
  res.json({
    groups: data.groups,
    services: data.services.map(buildServiceResponse),
  })
})

// Create service
app.post('/api/services', (req, res) => {
  const data = loadData()
  const svc = { id: Date.now().toString(), ...req.body }
  data.services.push(svc)
  saveData(data)
  res.json(buildServiceResponse(svc))
})

// Update service
app.put('/api/services/:id', (req, res) => {
  const data = loadData()
  const idx = data.services.findIndex((s) => s.id === req.params.id)
  if (idx === -1) return res.status(404).json({ error: 'not found' })
  data.services[idx] = { ...data.services[idx], ...req.body, id: req.params.id }
  saveData(data)
  res.json(buildServiceResponse(data.services[idx]))
})

// Delete service
app.delete('/api/services/:id', (req, res) => {
  const data = loadData()
  const svc = data.services.find((s) => s.id === req.params.id)
  data.services = data.services.filter((s) => s.id !== req.params.id)
  saveData(data)
  stopProcess(req.params.id, svc)
  res.json({ ok: true })
})

// Groups CRUD
app.put('/api/groups', (req, res) => {
  const data = loadData()
  data.groups = req.body.groups
  saveData(data)
  res.json({ groups: data.groups })
})

// Check if Docker daemon is running, start Docker Desktop if not
async function ensureDocker(pushLog) {
  try {
    execSync('docker info', { stdio: 'ignore', timeout: 5000, env: shellEnv })
    return true
  } catch {
    pushLog('[Docker not running, starting Docker Desktop...]\n')
    // Find Docker.app in common locations
    try {
      const dockerPath = execSync('mdfind "kMDItemCFBundleIdentifier == com.docker.docker" | head -1', { encoding: 'utf-8', env: shellEnv }).trim()
      if (dockerPath) {
        execSync(`open "${dockerPath}"`, { env: shellEnv })
      } else {
        execSync('open -a Docker', { env: shellEnv })
      }
    } catch {
      execSync('open -a Docker', { env: shellEnv })
    }
    // Wait up to 60s for Docker to be ready
    for (let i = 0; i < 30; i++) {
      await new Promise((r) => setTimeout(r, 2000))
      try {
        execSync('docker info', { stdio: 'ignore', timeout: 5000, env: shellEnv })
        pushLog('[Docker Desktop is ready]\n')
        return true
      } catch { /* still starting */ }
    }
    pushLog('[ERROR: Docker Desktop failed to start within 60s]\n')
    return false
  }
}

function isDockerService(svc) {
  return svc.group === 'docker' || /docker\s+compose|docker\s+run/.test(svc.command)
}

// Start service
app.post('/api/services/:id/start', async (req, res) => {
  const data = loadData()
  const svc = data.services.find((s) => s.id === req.params.id)
  if (!svc) return res.status(404).json({ error: 'not found' })
  if (getStatus(svc.id) === 'running') return res.json({ status: 'running' })

  const logs = []
  const pushLog = (data) => {
    const line = typeof data === 'string' ? data : data.toString()
    logs.push(line)
    if (logs.length > 500) logs.shift()
    broadcast({ type: 'log', id: svc.id, line })
  }

  // Docker services: ensure Docker Desktop is running first
  if (isDockerService(svc)) {
    broadcast({ type: 'status', id: svc.id, status: 'starting' })
    const ok = await ensureDocker(pushLog)
    if (!ok) {
      broadcast({ type: 'status', id: svc.id, status: 'stopped' })
      return res.json({ status: 'stopped', error: 'Docker failed to start' })
    }
  }

  // Support multiline commands: join lines with && so each line runs sequentially
  const cmd = svc.command.includes('\n')
    ? svc.command.split('\n').map(l => l.trim()).filter(Boolean).join(' && ')
    : svc.command
  const proc = spawn(cmd, {
    shell: true,
    cwd: svc.workDir || undefined,
    env: {
      ...process.env,
      PATH: EXTENDED_PATH,
      ...(svc.env || {}),
    },
  })

  proc.stdout.on('data', pushLog)
  proc.stderr.on('data', pushLog)
  proc.on('close', (code) => {
    pushLog(`\n[Process exited with code ${code}]\n`)
    broadcast({ type: 'status', id: svc.id, status: 'stopped' })
  })

  processes.set(svc.id, { proc, logs })
  broadcast({ type: 'status', id: svc.id, status: 'running' })
  res.json({ status: 'running' })
})

// Stop service
app.post('/api/services/:id/stop', (req, res) => {
  const data = loadData()
  const svc = data.services.find((s) => s.id === req.params.id)
  stopProcess(req.params.id, svc)
  broadcast({ type: 'status', id: req.params.id, status: 'stopped' })
  res.json({ status: 'stopped' })
})

function stopProcess(id, svc) {
  const entry = processes.get(id)

  // Custom stop command takes priority
  if (svc && svc.stopCommand) {
    try {
      execSync(svc.stopCommand, { cwd: svc.workDir || undefined, timeout: 30000, env: shellEnv, stdio: 'ignore' })
    } catch { /* ignore */ }
    if (entry) processes.delete(id)
    return
  }

  if (!entry) return
  // External docker containers: use docker compose stop
  if (entry.externalPid === -1 && svc && svc.workDir) {
    try {
      execSync('docker compose stop', { cwd: svc.workDir, timeout: 30000, env: shellEnv, stdio: 'ignore' })
    } catch { /* ignore */ }
    processes.delete(id)
    return
  }
  // External native process
  if (entry.externalPid && entry.externalPid > 0) {
    try { process.kill(entry.externalPid, 'SIGTERM') } catch { /* ignore */ }
    setTimeout(() => {
      try { process.kill(entry.externalPid, 'SIGKILL') } catch { /* ignore */ }
    }, 3000)
    processes.delete(id)
    return
  }
  // Spawned process
  if (entry.proc && entry.proc.exitCode === null) {
    entry.proc.kill('SIGTERM')
    setTimeout(() => {
      if (entry.proc.exitCode === null) entry.proc.kill('SIGKILL')
    }, 3000)
  }
}

// --- Serve frontend static files ---
const distPath = join(__dirname, '..', 'frontend', 'dist')
if (existsSync(distPath)) {
  app.use(express.static(distPath))
  app.get('/{*path}', (_req, res) => {
    res.sendFile(join(distPath, 'index.html'))
  })
}

// --- HTTP + WebSocket ---
const server = createServer(app)
const wss = new WebSocketServer({ server, path: '/ws' })

wss.on('connection', (ws) => {
  wsClients.add(ws)
  ws.on('close', () => wsClients.delete(ws))
})

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})
