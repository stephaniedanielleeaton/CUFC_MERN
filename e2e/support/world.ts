import { World, setWorldConstructor, IWorldOptions } from '@cucumber/cucumber'
import { Browser, BrowserContext, Page, chromium } from 'playwright'

export class PlaywrightWorld extends World {
  browser!: Browser
  context!: BrowserContext
  page!: Page

  constructor(options: IWorldOptions) {
    super(options)
  }

  async init(): Promise<void> {
    this.browser = await chromium.launch({ headless: false })
    this.context = await this.browser.newContext()
    this.page = await this.context.newPage()
  }

  async cleanup(): Promise<void> {
    await this.context?.close()
    await this.browser?.close()
  }
}

setWorldConstructor(PlaywrightWorld)
