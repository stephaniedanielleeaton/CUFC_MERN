import { Before, After, setDefaultTimeout, ITestCaseHookParameter } from '@cucumber/cucumber'
import * as fs from 'node:fs'
import { PlaywrightWorld } from './world'
import { setupAdminAuth, ADMIN_STORAGE_STATE } from './auth'
import { BASE_URL } from './config'

setDefaultTimeout(150000)

function isAdminStateValid(): boolean {
  if (!fs.existsSync(ADMIN_STORAGE_STATE)) return false
  try {
    const state = JSON.parse(fs.readFileSync(ADMIN_STORAGE_STATE, 'utf8'))
    const localStorageEntries = state.origins
      ?.flatMap((o: { localStorage?: { name: string; value: string }[] }) => o.localStorage ?? []) ?? []
    const authEntry = localStorageEntries.find((e: { name: string }) => e.name.startsWith('@@auth0spajs@@'))
    if (!authEntry) return false
    const { expiresAt } = JSON.parse(authEntry.value) as { expiresAt?: number }
    return typeof expiresAt === 'number' && expiresAt > Math.floor(Date.now() / 1000) + 60
  } catch {
    return false
  }
}

Before(async function (this: PlaywrightWorld, { pickle }: ITestCaseHookParameter) {
  const isAdmin = pickle.tags.some(tag => tag.name === '@admin')
  this.useAdminAuth = isAdmin
  if (isAdmin) {
    if (fs.existsSync(ADMIN_STORAGE_STATE) && !isAdminStateValid()) {
      console.log('[auth] Cached admin state is stale — deleting and re-authenticating')
      fs.unlinkSync(ADMIN_STORAGE_STATE)
    }
    if (!fs.existsSync(ADMIN_STORAGE_STATE)) {
      await setupAdminAuth(BASE_URL)
    }
  }
  await this.init()
})

After(async function (this: PlaywrightWorld) {
  await this.cleanup()
})
