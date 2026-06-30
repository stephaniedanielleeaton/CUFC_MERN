import { Before, After, setDefaultTimeout } from '@cucumber/cucumber'
import { PlaywrightWorld } from './world'

setDefaultTimeout(30000)

Before(async function (this: PlaywrightWorld) {
  await this.init()
})

After(async function (this: PlaywrightWorld) {
  await this.cleanup()
})
