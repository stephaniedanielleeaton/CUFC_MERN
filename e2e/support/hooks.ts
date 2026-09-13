import { Before, After, BeforeAll, setDefaultTimeout } from '@cucumber/cucumber'
import { PlaywrightWorld } from './world'
import { TestFixtures } from './fixtures'

setDefaultTimeout(150000)

// Clean up any stale test variations from previous runs before starting
BeforeAll(async function () {
  const deleted = await new TestFixtures().cleanupTestVariations()
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

After({ tags: '@fixtures' }, async function (this: PlaywrightWorld) {
  await this.fixtures.introClass.cleanup()
})

After({ tags: '@test-account' }, async function (this: PlaywrightWorld) {
  await this.fixtures.enrollmentAccount.cleanByEmail(this.testAccountEmail)
})
