import { World, setWorldConstructor, IWorldOptions } from '@cucumber/cucumber'
import { Browser, BrowserContext, Page, chromium } from 'playwright'
import * as fs from 'node:fs'
import { ADMIN_STORAGE_STATE, isAdminStateValid, setupAdminAuth } from './auth'
import { BASE_URL } from './config'
import { TestFixtures, CreatedIntroClass } from './fixtures'

export class PlaywrightWorld extends World {
  browser!: Browser
  context!: BrowserContext
  page!: Page
  adminContext?: BrowserContext
  adminPage?: Page
  useAdminAuth: boolean = false
  testAccountEmail?: string
  selectedVariationName?: string

  // Test fixtures for Square data setup
  fixtures!: TestFixtures
  createdIntroClass?: CreatedIntroClass

  constructor(options: IWorldOptions) {
    super(options)
    this.fixtures = new TestFixtures()
  }

  async init(): Promise<void> {
    this.browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--disable-blink-features=AutomationControlled'] })
    if (this.useAdminAuth && !fs.existsSync(ADMIN_STORAGE_STATE)) {
      await this.browser.close()
      throw new Error(`Admin auth required but storage state not found at ${ADMIN_STORAGE_STATE}`)
    }
    const contextOptions = this.useAdminAuth
      ? { storageState: ADMIN_STORAGE_STATE }
      : {}
    this.context = await this.browser.newContext(contextOptions)
    this.page = await this.context.newPage()
  }

  async initAdmin(): Promise<void> {
    if (!this.browser) {
      throw new Error('Browser not initialized; call init() first')
    }
    if (this.adminPage) {
      return
    }
    if (!fs.existsSync(ADMIN_STORAGE_STATE) || !isAdminStateValid(BASE_URL)) {
      await setupAdminAuth(BASE_URL)
    }
    this.adminContext = await this.browser.newContext({ storageState: ADMIN_STORAGE_STATE })
    this.adminPage = await this.adminContext.newPage()
  }

  async cleanup(): Promise<void> {
    // Clean up test data created during this scenario (only if fixtures were used)
    if (this.createdIntroClass) {
      await this.fixtures.introClass.cleanup()
    }

    if (this.testAccountEmail) {
      await this.fixtures.deleteSquareCustomerByEmail(this.testAccountEmail)
    }

    await this.adminPage?.close()
    await this.adminContext?.close()
    await this.context?.close()
    await this.browser?.close()
  }
}

setWorldConstructor(PlaywrightWorld)
