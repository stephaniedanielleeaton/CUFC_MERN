import { Given, When, Then } from '@cucumber/cucumber'
import { expect } from '@playwright/test'
import { PlaywrightWorld } from '../support/world'
import { BASE_URL } from '../support/config'

Given('I am on the home page', async function (this: PlaywrightWorld) {
  await this.page.goto(BASE_URL)
})

When('I select the first available intro class', async function (this: PlaywrightWorld) {
  const classList = this.page.getByRole('list', { name: 'Available Intro Classes' })
  try {
    await classList.waitFor({ state: 'visible', timeout: 15000 })
  } catch {
    const errorMsg = await this.page.locator('text=Unable to load class information').isVisible()
    const noClasses = await this.page.locator('text=No class dates are available').isVisible()
    const spinner = await this.page.locator('.animate-spin').isVisible()
    let diagnosis: string
    if (errorMsg) {
      diagnosis = 'component shows API error state'
    } else if (noClasses) {
      diagnosis = 'API returned no variations'
    } else if (spinner) {
      diagnosis = 'component is stuck in loading state (check Auth0 authLoading / profileLoading)'
    } else {
      diagnosis = 'unknown — class list, error, and spinner all not found'
    }
    throw new Error(`Class list not visible: ${diagnosis}`)
  }
  const firstItem = classList.locator('li').first()
  await firstItem.click()
})

When('I click {string}', async function (this: PlaywrightWorld, label: string) {
  await this.page.getByRole('button', { name: label }).click()
})

Then('I should see a popup titled {string}', async function (this: PlaywrightWorld, title: string) {
  await expect(this.page.getByRole('heading', { name: title })).toBeVisible()
})

Then('I should see a {string} button', async function (this: PlaywrightWorld, label: string) {
  await expect(this.page.getByRole('button', { name: label })).toBeVisible()
})

When('I fill in the guest profile form with valid details', async function (this: PlaywrightWorld) {
  const timestamp = Date.now()
  const email = `e2e.guest.${timestamp}@example.com`
  const uniqueLastName = `Guest ${timestamp}`
  this.testGuestEmail = email
  this.testGuestName = `Test ${uniqueLastName}`
  await this.page.locator('[name="displayFirstName"]').fill('Test')
  await this.page.locator('[name="displayLastName"]').fill(uniqueLastName)
  await this.page.locator('[name="legalFirstName"]').fill('Test')
  await this.page.locator('[name="legalLastName"]').fill(uniqueLastName)
  await this.page.locator('[name="email"]').fill(email)
  await this.page.locator('[name="dateOfBirth"]').fill('1990-01-15')
  await this.page.locator('[name="street"]').fill('123 Test Street')
  await this.page.locator('[name="city"]').fill('Washington')
  await this.page.locator('[name="state"]').fill('DC')
  await this.page.locator('[name="zip"]').fill('20001')
})

Then('I should be redirected to a checkout page', async function (this: PlaywrightWorld) {
  await this.page.waitForURL(
    url => !url.hostname.includes('localhost'),
    { timeout: 15000 }
  )
})

When('I complete the Square sandbox checkout', async function (this: PlaywrightWorld) {
  // Step 1 (Overview): click Next
  await this.page.getByRole('button', { name: 'Next' }).click()
  // Step 2 (Test Payment): wait for the button to be interactive before clicking
  const testPaymentBtn = this.page.getByRole('button', { name: 'Test Payment' })
  await testPaymentBtn.waitFor({ state: 'visible', timeout: 15000 })
  await testPaymentBtn.click()
  // Step 3 (Checkout Complete): get the redirect link href and navigate to it directly
  // (link may have target="_blank" so we navigate rather than click)
  const redirectLink = this.page.locator('a[href*="localhost"]')
  await redirectLink.waitFor({ state: 'visible', timeout: 15000 })
  const href = await redirectLink.getAttribute('href')
  if (!href) throw new Error('Square checkout redirect link found but has no href attribute')
  await this.page.goto(href)
  await this.page.waitForLoadState('load', { timeout: 15000 })
})

Then('I should be back on the home page', async function (this: PlaywrightWorld) {
  await expect(this.page).toHaveURL(`${BASE_URL}/`)
})
