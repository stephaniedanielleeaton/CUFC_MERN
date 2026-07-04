/**
 * E2E test runner (npm run test:e2e:full):
 * 1. Starts the API server and Vite dev client
 * 2. Waits until the detected Vite port accepts connections
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
    const controller = new AbortController()
    const abortTimer = setTimeout(() => controller.abort(), 5000)
    try {
      const res = await fetch(healthUrl, { signal: controller.signal })
      clearTimeout(abortTimer)
      if (res.ok) return
    } catch {
      clearTimeout(abortTimer)
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
    const timer = setTimeout(() => cleanupAndReject(new Error('Timed out waiting for Vite to start')), timeoutMs)
    const onData = chunk => {
      const stripped = chunk.toString().replace(/\x1b\[[0-9;]*m/g, '')
      const match = stripped.match(/https?:\/\/(?:localhost|127\.0\.0\.1):(\d+)/)
      if (match) { cleanup(); resolve(match[0]) }
    }
    const onExit = (code, signal) => {
      cleanupAndReject(new Error(`Vite process exited before URL was detected (code: ${code}, signal: ${signal})`))
    }
    const cleanup = () => {
      clearTimeout(timer)
      proc.stdout.off('data', onData)
      proc.stderr.off('data', onData)
      proc.off('exit', onExit)
    }
    const cleanupAndReject = err => {
      cleanup()
      reject(err)
    }
    proc.stdout.on('data', onData)
    proc.stderr.on('data', onData)
    proc.once('exit', onExit)
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

  const shutdown = () => {
    if (process.platform === 'win32') {
      // On Windows, spawned npm/cmd processes create child shells; taskkill /T
      // kills the entire tree rooted at the parent PID.
      ;[apiServer.pid, clientServer.pid].forEach(pid => {
        if (pid) {
          try {
            execSync(`taskkill /T /F /PID ${pid}`, { stdio: 'ignore' })
          } catch {
            // process may already be gone
          }
        }
      })
    }
    apiServer.kill()
    clientServer.kill()
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

    const TEST_TIMEOUT_MS = 10 * 60 * 1000
    execSync('npm run test:e2e', {
      stdio: 'inherit',
      cwd: root,
      env: { ...process.env, BASE_URL: baseUrl },
      timeout: TEST_TIMEOUT_MS
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
