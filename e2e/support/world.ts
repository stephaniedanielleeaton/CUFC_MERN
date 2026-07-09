import { World, setWorldConstructor, IWorldOptions } from '@cucumber/cucumber'
import { Browser, BrowserContext, Page, chromium } from 'playwright'
import * as fs from 'node:fs'
import { ADMIN_STORAGE_STATE, isAdminStateValid, setupAdminAuth } from './auth'
import { BASE_URL } from './config'

export class PlaywrightWorld extends World {
  browser!: Browser
  context!: BrowserContext
  page!: Page
  adminContext?: BrowserContext
  adminPage?: Page
  useAdminAuth: boolean = false
  testGuestEmail?: string
  testGuestName?: string

  constructor(options: IWorldOptions) {
    super(options)
  }

  async init(): Promise<void> {
    this.browser = await chromium.launch({ channel: 'chrome', headless: false, args: ['--disable-blink-features=AutomationControlled'] })
    if (this.useAdminAuth && !fs.existsSync(ADMIN_STORAGE_STATE)) {
      await this.browser.close()
      throw new Error(`Admin auth required but storage state not found at ${ADMIN_STORAGE_STATE}`)
    }
    const contextOptions = this.useAdminAuth
      ? { storageState: ADMIN_STORAGE_STATE }
      : {}
    this.context = await this.browser.newContext(contextOptions)
    if (!this.useAdminAuth) {
      // For guest contexts there is no auth0 session. Auth0 SDK fires a hidden iframe
      // to auth0.com/authorize?prompt=none (web_message response mode). Without an
      // existing auth0.com session cookie the real request can take >15 s in a fresh
      // Playwright context. We short-circuit it by fulfilling the iframe request
      // ourselves with a tiny HTML page that immediately posts `login_required` via
      // postMessage — identical to what auth0.com would do, so the SDK resolves
      // isLoading=false instantly.
      const appOrigin = new URL(BASE_URL).origin
      await this.context.route(/auth0\.com\/authorize/, async route => {
        const reqUrl = new URL(route.request().url())
        const state = reqUrl.searchParams.get('state') ?? ''
        const html =
          `<!DOCTYPE html><html><body><script>` +
          `(function(){window.parent.postMessage(` +
          `{type:'authorization_response',response:{error:'login_required',` +
          `error_description:'Login required',state:${JSON.stringify(state)}}},` +
          `${JSON.stringify(appOrigin)});})();</script></body></html>`
        await route.fulfill({ status: 200, contentType: 'text/html', body: html })
      })
    }
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
    await this.adminPage?.close()
    await this.adminContext?.close()
    await this.context?.close()
    await this.browser?.close()
  }
}

setWorldConstructor(PlaywrightWorld)
