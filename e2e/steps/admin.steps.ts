import { Given, When, Then } from '@cucumber/cucumber'
import { expect } from '@playwright/test'
import { PlaywrightWorld } from '../support/world'
import { BASE_URL } from '../support/config'

Given('I am logged in as an admin', async function (this: PlaywrightWorld) {
  await this.page.goto(BASE_URL)
  await this.page.waitForLoadState('domcontentloaded')
})

When('I navigate to the admin members page', async function (this: PlaywrightWorld) {
  await this.page.goto(`${BASE_URL}/admin/members`)
  await this.page.getByTestId('member-search-input').waitFor({ state: 'visible', timeout: 30000 })
})

When('I click the {string} status filter', async function (this: PlaywrightWorld, label: string) {
  await this.page.getByTestId(`status-filter-${label.toLowerCase()}`).click()
})

When('I search for {string}', async function (this: PlaywrightWorld, query: string) {
  const searchInput = this.page.getByTestId('member-search-input')
  await searchInput.fill(query)
})

Then('I should see at least one member in the results', async function (this: PlaywrightWorld) {
  const firstMember = this.page.getByTestId('member-card').first()
  await expect(firstMember).toBeVisible({ timeout: 10000 })
})
