import { Before, After, setDefaultTimeout, ITestCaseHookParameter } from '@cucumber/cucumber'
import * as fs from 'node:fs'
import { PlaywrightWorld } from './world'
import { setupAdminAuth, ADMIN_STORAGE_STATE, isAdminStateValid } from './auth'
import { BASE_URL } from './config'

setDefaultTimeout(150000)

Before(async function (this: PlaywrightWorld, { pickle }: ITestCaseHookParameter) {
  const isAdmin = pickle.tags.some(tag => tag.name === '@admin')
  this.useAdminAuth = isAdmin
  if (isAdmin) {
    if (fs.existsSync(ADMIN_STORAGE_STATE) && !isAdminStateValid(BASE_URL)) {
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
