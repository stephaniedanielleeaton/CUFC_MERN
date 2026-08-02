import { Before, After, BeforeAll, setDefaultTimeout, ITestCaseHookParameter } from '@cucumber/cucumber'
import * as fs from 'node:fs'
import { PlaywrightWorld } from './world'
import { setupAdminAuth, ADMIN_STORAGE_STATE, isAdminStateValid, resetAdminProfileToIncomplete } from './auth'
import { BASE_URL } from './config'
import { SquareTestClient } from './fixtures/square-client'

setDefaultTimeout(150000)

// Clean up any stale test variations from previous runs before starting
BeforeAll(async function () {
  const accessToken = process.env.SQUARE_ACCESS_TOKEN
  const locationId = process.env.SQUARE_RETAIL_LOCATION_ID

  if (!accessToken || !locationId) {
    console.log('[hooks] Square credentials not set — skipping stale test data cleanup')
    return
  }

  const client = new SquareTestClient({
    accessToken,
    environment: 'sandbox',
    locationId,
  })

  const deleted = await client.cleanupTestVariations()
  if (deleted > 0) {
    console.log(`[hooks] Cleaned up ${deleted} stale test variation(s)`)
  }

  // Ensure the authenticated enrollment scenario starts with an incomplete profile
  // so it can exercise the full "complete profile and checkout" flow.
  await resetAdminProfileToIncomplete(BASE_URL)
})

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
