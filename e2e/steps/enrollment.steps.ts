import { Given, When, Then } from '@cucumber/cucumber'
import { expect } from '@playwright/test'
import { PlaywrightWorld } from '../support/world'

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:5173'

Given('I am on the home page', async function (this: PlaywrightWorld) {
  await this.page.goto(BASE_URL)
})

When('I select the first available intro class', async function (this: PlaywrightWorld) {
  const classList = this.page.getByRole('list', { name: 'Available Intro Classes' })
  await classList.waitFor({ state: 'visible', timeout: 10000 })
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
  const uniqueEmail = `e2e.guest.${Date.now()}@example.com`
  await this.page.locator('[name="displayFirstName"]').fill('Test')
  await this.page.locator('[name="displayLastName"]').fill('Guest')
  await this.page.locator('[name="legalFirstName"]').fill('Test')
  await this.page.locator('[name="legalLastName"]').fill('Guest')
  await this.page.locator('[name="email"]').fill(uniqueEmail)
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
  // TODO: remove after inspecting the Square sandbox checkout UI
  await this.page.waitForTimeout(10000)
})
