/**
 * E2E test runner (npm run test:e2e:full):
 * 1. Starts the API server and Vite dev client
 * 2. Waits until port 5173 accepts connections
 * 3. Runs e2e tests (Cucumber + Playwright)
 * 4. Shuts down both servers
 */
const { spawn, execSync } = require('node:child_process')
const { realpathSync } = require('node:fs')
const net = require('node:net')

const POLL_INTERVAL_MS = 500
const TIMEOUT_MS = 60000

async function waitForApi(baseUrl, timeoutMs) {
  const healthUrl = `${baseUrl}/api/health`
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(healthUrl)
      if (res.ok) return
    } catch {
      // not ready yet
    }
    await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL_MS))
  }
  throw new Error(`Timed out waiting for API health check at ${healthUrl}`)
}

function waitForPort(port, timeoutMs) {
  return new Promise((resolve, reject) => {
    const start = Date.now()
    const check = () => {
      const socket = net.connect({ port, host: 'localhost' })
      socket.once('connect', () => { socket.destroy(); resolve() })
      socket.once('error', () => {
        socket.destroy()
        if (Date.now() - start > timeoutMs) {
          reject(new Error(`Timed out waiting for port ${port}`))
        } else {
          setTimeout(check, POLL_INTERVAL_MS)
        }
      })
    }
    check()
  })
}

function detectViteUrl(proc, timeoutMs) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Timed out waiting for Vite to start')), timeoutMs)
    const onData = chunk => {
      const stripped = chunk.toString().replace(/\x1b\[[0-9;]*m/g, '')
      const match = stripped.match(/https?:\/\/localhost:(\d+)/)
      if (match) { clearTimeout(timer); resolve(`http://localhost:${match[1]}`) }
    }
    proc.stdout.on('data', onData)
    proc.stderr.on('data', onData)
  })
}

async function main() {
  const root = realpathSync.native(__dirname)

  console.log('Starting API server and client...')
  const apiServer = spawn('npm', ['run', 'dev:server'], { shell: true, stdio: 'pipe', cwd: root })
  const clientServer = spawn('npm', ['run', 'dev:client'], { shell: true, stdio: 'pipe', cwd: root })

  apiServer.stdout.on('data', d => process.stdout.write(d))
  apiServer.stderr.on('data', d => process.stderr.write(d))
  clientServer.stdout.on('data', d => process.stdout.write(d))
  clientServer.stderr.on('data', d => process.stderr.write(d))

  const killTree = (proc) => {
    if (process.platform === 'win32') {
      spawn('taskkill', ['/f', '/t', '/pid', String(proc.pid)], { stdio: 'ignore' })
    } else {
      proc.kill()
    }
  }

  const shutdown = () => {
    killTree(apiServer)
    killTree(clientServer)
  }

  process.once('SIGINT', () => { shutdown(); process.exit(130) })
  process.once('SIGTERM', () => { shutdown(); process.exit(143) })

  let exitCode = 0
  try {
    const baseUrl = await detectViteUrl(clientServer, TIMEOUT_MS)
    const port = new URL(baseUrl).port
    console.log(`Vite started on ${baseUrl}, waiting for port ${port}...`)
    await waitForPort(Number(port), TIMEOUT_MS)
    console.log('Client ready. Waiting for API...')
    await waitForApi(baseUrl, TIMEOUT_MS)
    console.log('API ready.\n')

    execSync('npm run test:e2e', {
      stdio: 'inherit',
      cwd: root,
      env: { ...process.env, BASE_URL: baseUrl }
    })
  } catch (err) {
    console.error('\nTests failed:', err.message)
    exitCode = 1
  } finally {
    console.log('\nStopping servers...')
    shutdown()
  }

  process.exit(exitCode)
}

main()
