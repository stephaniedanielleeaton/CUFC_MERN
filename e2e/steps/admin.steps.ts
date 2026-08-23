import { Given, When, Then } from '@cucumber/cucumber'
import { expect } from '@playwright/test'
import { PlaywrightWorld } from '../support/world'
import { BASE_URL, TEST_MEMBER_EMAIL } from '../support/config'

Given('the enrollment test account has a completed profile', async function (this: PlaywrightWorld) {
  this.testAccountEmail = TEST_MEMBER_EMAIL
  await this.initAdmin()
  await this.adminPage!.goto(`${BASE_URL}/admin/members`)
  await this.adminPage!.getByTestId('member-search-input').waitFor({ state: 'visible', timeout: 30000 })

  await this.adminPage!.getByRole('button', { name: '+ Add Member' }).click()
  await this.adminPage!.locator('#newMemberFirstName').fill('Test')
  await this.adminPage!.locator('#newMemberLastName').fill('User')
  await this.adminPage!.locator('#newMemberEmail').fill(TEST_MEMBER_EMAIL)
  await this.adminPage!.getByRole('button', { name: 'Add Member', exact: true }).click()

  await this.adminPage!.getByTestId('status-filter-all').click()
  await this.adminPage!.getByTestId('member-search-input').fill(TEST_MEMBER_EMAIL)
  const memberCard = this.adminPage!.getByTestId('member-card').first()
  await memberCard.waitFor({ state: 'visible', timeout: 10000 })
  await memberCard.click()

  await this.adminPage!.getByRole('textbox', { name: 'Legal First Name' }).fill('Test')
  await this.adminPage!.getByRole('textbox', { name: 'Legal Last Name' }).fill('User')
  await this.adminPage!.getByRole('textbox', { name: 'Date of Birth' }).fill('1990-01-15')
  await this.adminPage!.getByRole('textbox', { name: 'Street' }).fill('123 Test Street')
  await this.adminPage!.getByRole('textbox', { name: 'City' }).fill('Washington')
  await this.adminPage!.getByRole('textbox', { name: 'State' }).fill('DC')
  await this.adminPage!.getByRole('textbox', { name: 'ZIP' }).fill('20001')
  await this.adminPage!.getByText('Profile complete', { exact: true }).click()
  await this.adminPage!.getByRole('button', { name: 'Save Changes' }).click()
  await expect(this.adminPage!.getByText('Changes saved')).toBeVisible({ timeout: 10000 })
})

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

When('I search for the test account', async function (this: PlaywrightWorld) {
  if (!this.testAccountEmail) {
    throw new Error('No test account email was recorded; ensure the enrollment step ran first')
  }
  const searchInput = this.adminPage!.getByTestId('member-search-input')
  await searchInput.fill(this.testAccountEmail)
})

Then('I should see at least one member in the results', async function (this: PlaywrightWorld) {
  const firstMember = this.adminPage!.getByTestId('member-card').first()
  await expect(firstMember).toBeVisible({ timeout: 10000 })
})

Then('I should see the test account in the results', async function (this: PlaywrightWorld) {
  const firstMember = this.adminPage!.getByTestId('member-card').first()
  await expect(firstMember).toBeVisible({ timeout: 10000 })
})

When('I expand the test account details', async function (this: PlaywrightWorld) {
  const card = this.adminPage!.getByTestId('member-card').first()
  await card.click()
})

Then('the Square Customer ID field should be populated', async function (this: PlaywrightWorld) {
  const input = this.adminPage!.getByRole('textbox', { name: 'Square Customer ID' })
  await expect(input).not.toHaveValue('')
})

Then('the member status should be {string}', async function (this: PlaywrightWorld, status: string) {
  const select = this.adminPage!.locator('select[name="memberStatus"]')
  await expect(select).toHaveValue(status, { timeout: 30000 })
})

Then('the profile should be complete', async function (this: PlaywrightWorld) {
  const checkbox = this.adminPage!.getByRole('checkbox', { name: 'Profile complete' })
  await expect(checkbox).toBeChecked()
})

When('I wait for the enrollment to finish processing', async function (this: PlaywrightWorld) {
  // Allow time for Square webhook to process the payment and update member status
  await this.page.waitForTimeout(8000)
})

When('I view the recent transactions', async function (this: PlaywrightWorld) {
  const viewBtn = this.adminPage!.getByRole('button', { name: 'View last 3 months' })
  await viewBtn.click()
})

Then('I should see a transaction for the intro enrollment', async function (this: PlaywrightWorld) {
  const transactionList = this.adminPage!.getByTestId('transaction-list')
  await expect(transactionList).toContainText('Introduction to Historical European Martial Arts', { timeout: 30000 })
})

When('I delete the test account', async function (this: PlaywrightWorld) {
  const deleteBtn = this.adminPage!.getByRole('button', { name: 'Delete member' })
  await deleteBtn.waitFor({ state: 'visible', timeout: 5000 })
  await deleteBtn.click({ force: true })
})

When('I confirm the deletion', async function (this: PlaywrightWorld) {
  const confirmBtn = this.adminPage!.getByRole('button', { name: 'Confirm' })
  await confirmBtn.waitFor({ state: 'visible', timeout: 5000 })
  await confirmBtn.click({ force: true })
  await expect(this.adminPage!.getByText('Delete this member?')).toBeHidden({ timeout: 5000 })
})

Then('the test account should no longer appear in the results', async function (this: PlaywrightWorld) {
  await expect(this.adminPage!.getByTestId('member-card')).toHaveCount(0, { timeout: 10000 })
})
