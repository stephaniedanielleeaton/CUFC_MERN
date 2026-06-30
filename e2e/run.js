const { execSync } = require('node:child_process')
const { realpathSync } = require('node:fs')
const { join } = require('node:path')

// Normalize the CWD to the real on-disk casing (Windows NTFS is case-insensitive
// but Node's module cache is case-sensitive, causing duplicate Cucumber instances
// when the path case differs between the npm invocation and the install path).
const realCwd = realpathSync.native(process.cwd())
const cucumberBin = join(realCwd, '..', 'node_modules', '.bin', 'cucumber-js')
const args = process.argv.slice(2).join(' ')

try {
  execSync(`${cucumberBin} ${args}`, {
    cwd: realCwd,
    shell: true,
    stdio: 'inherit',
    env: { ...process.env }
  })
} catch (err) {
  process.exit(err.status ?? 1)
}
