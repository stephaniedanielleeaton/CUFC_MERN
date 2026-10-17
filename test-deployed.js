const { spawn } = require('node:child_process')
const { join } = require('node:path')

function getDeployedBaseUrl() {
  const value = process.argv[2] ?? process.env.BASE_URL
  if (!value) {
    throw new Error('Provide a deployed URL, for example: npm run test:e2e:deployed -- https://cufc-mern-dev.onrender.com')
  }

  const url = new URL(value)
  if (url.protocol !== 'https:') {
    throw new Error('BASE_URL must use HTTPS for deployed E2E tests')
  }
  if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') {
    throw new Error('BASE_URL must reference a deployed instance, not localhost')
  }

  return url.origin
}

function run() {
  const baseUrl = getDeployedBaseUrl()
  const child = spawn(process.execPath, [join(__dirname, 'e2e', 'run.js')], {
    cwd: join(__dirname, 'e2e'),
    env: { ...process.env, BASE_URL: baseUrl },
    stdio: 'inherit',
  })

  child.on('error', error => {
    console.error(`Unable to run deployed E2E tests: ${error.message}`)
    process.exitCode = 1
  })
  child.on('exit', code => {
    process.exitCode = code ?? 1
  })
}

try {
  run()
} catch (error) {
  console.error(`Deployed E2E configuration error: ${error.message}`)
  process.exitCode = 1
}