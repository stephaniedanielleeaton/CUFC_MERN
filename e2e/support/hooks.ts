import { Before, After, BeforeAll, setDefaultTimeout } from '@cucumber/cucumber'
import { PlaywrightWorld } from './world'
import { createTestFixtures } from './fixtures'

setDefaultTimeout(150000)

// Clean up any stale test variations from previous runs before starting
BeforeAll(async function () {
  const accessToken = process.env.SQUARE_ACCESS_TOKEN
  const locationId = process.env.SQUARE_RETAIL_LOCATION_ID

  if (!accessToken || !locationId) {
    console.log('[hooks] Square credentials not set — skipping stale test data cleanup')
    return
  }

  const deleted = await createTestFixtures().cleanupTestVariations()
  if (deleted > 0) {
    console.log(`[hooks] Cleaned up ${deleted} stale test variation(s)`)
  }
})

Before(async function (this: PlaywrightWorld) {
  await this.init()
})

After(async function (this: PlaywrightWorld) {
  await this.cleanup()
})
