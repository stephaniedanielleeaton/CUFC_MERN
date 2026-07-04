import { chromium } from 'playwright'
import * as path from 'node:path'
import * as fs from 'node:fs'

export const ADMIN_STORAGE_STATE = path.join(__dirname, '..', '.auth', 'admin.json')

export function isAdminStateValid(): boolean {
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

export async function setupAdminAuth(baseUrl: string): Promise<void> {
  const email = process.env.E2E_ADMIN_EMAIL
  const password = process.env.E2E_ADMIN_PASSWORD

  if (!email || !password) {
    throw new Error('Missing required env vars: E2E_ADMIN_EMAIL, E2E_ADMIN_PASSWORD')
  }

  fs.mkdirSync(path.dirname(ADMIN_STORAGE_STATE), { recursive: true })

  const browser = await chromium.launch({
    headless: false,
    channel: 'chrome',
    args: ['--disable-blink-features=AutomationControlled'],
  })
  const context = await browser.newContext()
  const page = await context.newPage()

  try {
    await page.goto(baseUrl)
    await page.getByRole('button', { name: 'Sign In' }).click()
    await page.waitForURL(/auth0\.com/, { timeout: 15000 })
    await page.locator('input[name="username"], #username').fill(email)
    await page.locator('input[name="password"], #password').fill(password)
    await page.locator('button[name="action"]').click()

    console.log('\n[auth] Complete any MFA prompt in the browser window (up to 2 minutes)...\n')
    await page.waitForURL(url => url.hostname.includes('localhost'), { timeout: 120000 })
    await page.waitForLoadState('networkidle')

    await context.storageState({ path: ADMIN_STORAGE_STATE })
    console.log('[auth] Admin session cached.')
  } finally {
    await browser.close()
  }
}
