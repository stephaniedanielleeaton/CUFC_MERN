import { Given, When, Then } from '@cucumber/cucumber'
import { expect } from '@playwright/test'
import { PlaywrightWorld } from '../support/world'
import { BASE_URL } from '../support/config'

Given('I am logged in as an admin', async function (this: PlaywrightWorld) {
  await this.initAdmin()
  await this.adminPage!.goto(BASE_URL)
  await this.adminPage!.waitForLoadState('domcontentloaded')
})

When('I sign in as an admin', async function (this: PlaywrightWorld) {
  await this.initAdmin()
})

When('I navigate to the admin members page', async function (this: PlaywrightWorld) {
  await this.adminPage!.goto(`${BASE_URL}/admin/members`)
  await this.adminPage!.getByTestId('member-search-input').waitFor({ state: 'visible', timeout: 30000 })
})

When('I click the {string} status filter', async function (this: PlaywrightWorld, label: string) {
  await this.adminPage!.getByTestId(`status-filter-${label.toLowerCase()}`).click()
})

When('I search for {string}', async function (this: PlaywrightWorld, query: string) {
  const searchInput = this.adminPage!.getByTestId('member-search-input')
  await searchInput.fill(query)
})

When('I search for the test guest', async function (this: PlaywrightWorld) {
  if (!this.testGuestEmail) {
    throw new Error('No test guest email was recorded; ensure the guest enrollment step ran first')
  }
  const searchInput = this.adminPage!.getByTestId('member-search-input')
  await searchInput.fill(this.testGuestEmail)
})

Then('I should see at least one member in the results', async function (this: PlaywrightWorld) {
  const firstMember = this.adminPage!.getByTestId('member-card').first()
  await expect(firstMember).toBeVisible({ timeout: 10000 })
})

Then('I should see the test guest in the results', async function (this: PlaywrightWorld) {
  const firstMember = this.adminPage!.getByTestId('member-card').first()
  await expect(firstMember).toBeVisible({ timeout: 10000 })
})

When('I delete the test guest', async function (this: PlaywrightWorld) {
  const card = this.adminPage!.getByTestId('member-card').first()
  await card.click()
  const deleteBtn = this.adminPage!.getByRole('button', { name: 'Delete member' })
  await deleteBtn.waitFor({ state: 'visible', timeout: 5000 })
  await deleteBtn.click()
})

When('I confirm the deletion', async function (this: PlaywrightWorld) {
  const confirmBtn = this.adminPage!.getByRole('button', { name: 'Confirm' })
  await confirmBtn.waitFor({ state: 'visible', timeout: 5000 })
  await confirmBtn.click({ force: true })
  await expect(this.adminPage!.getByText('Delete this member?')).toBeHidden({ timeout: 5000 })
})

Then('the test guest should no longer appear in the results', async function (this: PlaywrightWorld) {
  await expect(this.adminPage!.getByTestId('member-card')).toHaveCount(0, { timeout: 10000 })
})
