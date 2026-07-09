/**
 * E2E test runner (npm run test:e2e:full):
 * 1. Builds the client so the API server can serve it from client/dist
 * 2. Starts the API server
 * 3. Runs e2e tests (Cucumber + Playwright) against http://localhost:3000
 * 4. Shuts down the server
 */
const { spawn, execSync } = require('node:child_process')

function runTest(root, baseUrl, timeoutMs) {
  return new Promise((resolve, reject) => {
    const child = spawn('npm', ['run', 'test:e2e'], {
      shell: true,
      stdio: 'inherit',
      cwd: root,
      env: { ...process.env, BASE_URL: baseUrl }
    })

    const timeout = setTimeout(() => {
      child.kill()
      reject(new Error(`E2E test timed out after ${timeoutMs}ms`))
    }, timeoutMs)

    child.on('error', reject)
    child.on('exit', (code) => {
      clearTimeout(timeout)
      if (code === 0) {
        resolve()
      } else {
        reject(new Error(`E2E test exited with code ${code}`))
      }
    })
  })
}
const { realpathSync } = require('node:fs')

const POLL_INTERVAL_MS = 500
const TIMEOUT_MS = 60000
const BUILD_TIMEOUT_MS = 3 * 60 * 1000

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

function buildClient(root) {
  console.log('Building shared package and client...')
  execSync('npm run build --workspace=@cufc/shared && npm run build --workspace=client', {
    stdio: 'inherit',
    cwd: root,
    shell: true,
    timeout: BUILD_TIMEOUT_MS,
  })
  console.log('Client build complete.')
}

async function main() {
  const root = realpathSync.native(__dirname)

  console.log('Starting API server...')
  const apiServer = spawn('npm', ['run', 'dev:server'], { shell: true, stdio: 'pipe', cwd: root })

  apiServer.stdout.on('data', d => process.stdout.write(d))
  apiServer.stderr.on('data', d => process.stderr.write(d))

  const shutdown = () => {
    if (process.platform === 'win32') {
      // On Windows, spawned npm/cmd processes create child shells; taskkill /T
      // kills the entire tree rooted at the parent PID.
      if (apiServer.pid) {
        try {
          execSync(`taskkill /T /F /PID ${apiServer.pid}`, { stdio: 'ignore' })
        } catch {
          // process may already be gone
        }
      }
    }
    apiServer.kill()
  }

  process.once('SIGINT', () => { shutdown(); process.exit(130) })
  process.once('SIGTERM', () => { shutdown(); process.exit(143) })

  let exitCode = 0
  try {
    buildClient(root)

    const baseUrl = 'http://localhost:3000'
    console.log('Waiting for API...')
    await waitForApi(baseUrl, TIMEOUT_MS)
    console.log('API ready.\n')

    const TEST_TIMEOUT_MS = 10 * 60 * 1000
    await runTest(root, baseUrl, TEST_TIMEOUT_MS)
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
