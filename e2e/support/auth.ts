import { chromium } from 'playwright'
import * as path from 'node:path'
import * as fs from 'node:fs'

export const ADMIN_STORAGE_STATE = path.join(__dirname, '..', '.auth', 'admin.json')

type StorageStateOrigin = {
  origin: string
  localStorage?: { name: string; value: string }[]
}

type Auth0CacheEntry = {
  expiresAt?: number
  body?: {
    access_token?: string
  }
}

function getAdminAuth0CacheEntry(baseUrl: string): Auth0CacheEntry | null {
  if (!fs.existsSync(ADMIN_STORAGE_STATE)) return null
  try {
    const state = JSON.parse(fs.readFileSync(ADMIN_STORAGE_STATE, 'utf8')) as { origins?: StorageStateOrigin[] }
    const expectedOrigin = new URL(baseUrl).origin
    const localStorageEntries = state.origins
      ?.filter((originEntry) => originEntry.origin === expectedOrigin)
      .flatMap((originEntry) => originEntry.localStorage ?? []) ?? []
    const authEntry = localStorageEntries.find((entry) => entry.name.startsWith('@@auth0spajs@@'))
    if (!authEntry) return null
    return JSON.parse(authEntry.value) as Auth0CacheEntry
  } catch {
    return null
  }
}

export function isAdminStateValid(baseUrl: string): boolean {
  const authEntry = getAdminAuth0CacheEntry(baseUrl)
  return typeof authEntry?.expiresAt === 'number' && authEntry.expiresAt > Math.floor(Date.now() / 1000) + 60
}

function getAdminAccessToken(baseUrl: string): string | null {
  return getAdminAuth0CacheEntry(baseUrl)?.body?.access_token ?? null
}

export async function performAuth0Login(
  page: import('playwright').Page,
  baseUrl: string,
  email: string,
  password: string
): Promise<void> {
  await page.goto(baseUrl)
  await page.getByRole('button', { name: 'Sign In' }).click()
  await page.waitForURL(/auth0\.com/, { timeout: 15000 })
  await page.locator('input[name="username"], #username').fill(email)
  await page.locator('input[name="password"], #password').fill(password)
  await page.locator('button[name="action"]').click()

  console.log('\n[auth] Complete any MFA prompt in the browser window (up to 2 minutes)...\n')
  const appOrigin = new URL(baseUrl).origin
  await page.waitForURL(url => url.origin === appOrigin, { timeout: 120000 })
  await page.waitForLoadState('networkidle')
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
    await performAuth0Login(page, baseUrl, email, password)

    await context.storageState({ path: ADMIN_STORAGE_STATE })
    console.log('[auth] Admin session cached.')
  } finally {
    await browser.close()
  }
}

export async function resetAdminProfileToIncomplete(baseUrl: string): Promise<void> {
  const email = process.env.E2E_ADMIN_EMAIL
  const password = process.env.E2E_ADMIN_PASSWORD

  if (!email || !password) {
    console.log('[auth] Admin credentials not set — skipping profile reset')
    return
  }

  if (!fs.existsSync(ADMIN_STORAGE_STATE) || !isAdminStateValid(baseUrl)) {
    await setupAdminAuth(baseUrl)
  }

  const browser = await chromium.launch({
    headless: false,
    channel: 'chrome',
    args: ['--disable-blink-features=AutomationControlled'],
  })

  try {
    const accessToken = getAdminAccessToken(baseUrl)
    if (!accessToken) {
      throw new Error('Cached admin access token not found')
    }

    const context = await browser.newContext({ storageState: ADMIN_STORAGE_STATE })
    const request = context.request
    const headers = { Authorization: `Bearer ${accessToken}` }

    const profileResponse = await request.get(`${baseUrl}/api/members/me`, { headers })
    if (!profileResponse.ok()) {
      throw new Error(`Failed to fetch admin profile: ${profileResponse.status()} ${await profileResponse.text()}`)
    }

    const { profile } = await profileResponse.json() as { profile: { _id: string; profileComplete?: boolean } | null }
    if (!profile) {
      console.log('[auth] Admin profile not found — no reset needed')
      await context.close()
      return
    }

    if (profile.profileComplete === false) {
      console.log('[auth] Admin profile is already incomplete — no reset needed')
      await context.close()
      return
    }

    const updateResponse = await request.post(`${baseUrl}/api/members/me/update`, {
      headers,
      data: { data: { profileComplete: false } },
    })
    if (!updateResponse.ok()) {
      throw new Error(`Failed to reset admin profile: ${updateResponse.status()} ${await updateResponse.text()}`)
    }

    console.log(`[auth] Reset admin profile ${profile._id} to incomplete`)
    await context.close()
  } finally {
    await browser.close()
  }
}
