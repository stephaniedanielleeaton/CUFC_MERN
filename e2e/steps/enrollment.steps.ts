import { Given, When, Then } from '@cucumber/cucumber'
import { expect } from '@playwright/test'
import type { Page } from 'playwright'
import { PlaywrightWorld } from '../support/world'
import { BASE_URL, TEST_MEMBER_EMAIL, TEST_MEMBER_PASSWORD } from '../support/config'

async function getAccessToken(page: Page): Promise<string> {
  const token = await page.evaluate(() => {
    for (const key of Object.keys(window.localStorage)) {
      if (!key.startsWith('@@auth0spajs@@')) continue
      const value = window.localStorage.getItem(key)
      if (!value) continue
      const parsed = JSON.parse(value) as { body?: { access_token?: string } }
      if (parsed.body?.access_token) return parsed.body.access_token
    }
    return null
  })

  if (!token) {
    throw new Error('Auth0 access token was not found in local storage')
  }

  return token
}

async function fillRequiredProfileFields(page: Page): Promise<void> {
  const firstNameInput = page.locator('[name="displayFirstName"]')
  if (await firstNameInput.inputValue() === '') {
    await firstNameInput.fill('Test')
  }

  const lastNameInput = page.locator('[name="displayLastName"]')
  if (await lastNameInput.inputValue() === '') {
    await lastNameInput.fill('User')
  }

  const legalFirstInput = page.locator('[name="legalFirstName"]')
  if (await legalFirstInput.inputValue() === '') {
    await legalFirstInput.fill('Test')
  }

  const legalLastInput = page.locator('[name="legalLastName"]')
  if (await legalLastInput.inputValue() === '') {
    await legalLastInput.fill('User')
  }

  const dateOfBirthInput = page.locator('[name="dateOfBirth"]')
  if (await dateOfBirthInput.inputValue() === '') {
    await dateOfBirthInput.fill('1990-01-15')
  }

  const streetInput = page.locator('[name="street"]')
  if (await streetInput.inputValue() === '') {
    await streetInput.fill('123 Test Street')
  }

  const cityInput = page.locator('[name="city"]')
  if (await cityInput.inputValue() === '') {
    await cityInput.fill('Washington')
  }

  const stateInput = page.locator('[name="state"]')
  if (await stateInput.inputValue() === '') {
    await stateInput.fill('DC')
  }

  const zipInput = page.locator('[name="zip"]')
  if (await zipInput.inputValue() === '') {
    await zipInput.fill('20001')
  }

  const emailInput = page.locator('[name="email"]')
  if (await emailInput.inputValue() === '') {
    await emailInput.fill('columbusunitedfencingclub@gmail.com')
  }
}

Given('I am on the home page', async function (this: PlaywrightWorld) {
  await this.page.goto(BASE_URL)
})

When('I navigate to the dashboard', async function (this: PlaywrightWorld) {
  await this.page.goto(`${BASE_URL}/dashboard`)
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
  // Use the fixture's variation name as the source of truth for later assertions.
  // Fallback to the DOM text only if the fixture was not set up in this scenario.
  const variationName = this.createdIntroClass?.variations[0]?.name
  this.selectedVariationName = variationName ??
    (await firstItem.locator('[class*="font-medium"]').textContent())?.trim() ??
    undefined
  await firstItem.click()
})

When('I select the {string} intro class', async function (this: PlaywrightWorld, className: string) {
  const classList = this.page.getByRole('list', { name: 'Available Intro Classes' })
  await classList.waitFor({ state: 'visible', timeout: 15000 })
  const classButton = classList.getByRole('button', { name: className })
  await classButton.click()
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
  this.testAccountEmail = email
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

When('I fill in the guest profile form with the sign-in email', async function (this: PlaywrightWorld) {
  const email = TEST_MEMBER_EMAIL
  this.testAccountEmail = email
  await this.page.locator('[name="displayFirstName"]').fill('Linked')
  await this.page.locator('[name="displayLastName"]').fill('Guest')
  await this.page.locator('[name="legalFirstName"]').fill('Linked')
  await this.page.locator('[name="legalLastName"]').fill('Guest')
  await this.page.locator('[name="email"]').fill(email)
  await this.page.locator('[name="dateOfBirth"]').fill('1990-01-15')
  await this.page.locator('[name="street"]').fill('123 Test Street')
  await this.page.locator('[name="city"]').fill('Washington')
  await this.page.locator('[name="state"]').fill('DC')
  await this.page.locator('[name="zip"]').fill('20001')
})

Then('I should be redirected to a checkout page', async function (this: PlaywrightWorld) {
  const appOrigin = new URL(BASE_URL).origin
  await this.page.waitForURL(
    url => url.origin !== appOrigin,
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
  const appOrigin = new URL(BASE_URL).origin
  const redirectLink = this.page.locator(`a[href*="${appOrigin}"]`)
  await redirectLink.waitFor({ state: 'visible', timeout: 15000 })
  const href = await redirectLink.getAttribute('href')
  if (!href) throw new Error('Square checkout redirect link found but has no href attribute')
  await this.page.goto(href)
  await this.page.waitForLoadState('load', { timeout: 15000 })
})

Then('I should be back on the home page', async function (this: PlaywrightWorld) {
  await expect(this.page).toHaveURL(`${BASE_URL}/`)
})

When('I view the intro class offerings', async function (this: PlaywrightWorld) {
  // Wait for the intro class offerings section to load
  const classList = this.page.getByRole('list', { name: 'Available Intro Classes' })
  await classList.waitFor({ state: 'visible', timeout: 15000 })
})

// Authenticated enrollment steps

Then('I should be redirected to the Auth0 login page', async function (this: PlaywrightWorld) {
  await expect.poll(() => this.page.url(), { timeout: 15000 }).toContain('auth0.com')
})

When('I complete the Auth0 login', async function (this: PlaywrightWorld) {
  // Store the email for later verification
  this.testAccountEmail = TEST_MEMBER_EMAIL
  
  // We are already on the Auth0 login page, so fill the form directly.
  // (Don't navigate home — that would lose the returnTo intent set by the app.)
  await this.page.locator('input[name="username"], #username').fill(TEST_MEMBER_EMAIL)
  await this.page.locator('input[name="password"], #password').fill(TEST_MEMBER_PASSWORD)
  await this.page.locator('button[name="action"]').click()
  
  console.log('\n[auth] Complete any MFA prompt in the browser window (up to 2 minutes)...\n')
  const appOrigin = new URL(BASE_URL).origin
  await this.page.waitForURL(url => url.origin === appOrigin, { timeout: 120000 })
  await this.page.waitForLoadState('networkidle')
})

Then('I should be on the pending enrollment page', async function (this: PlaywrightWorld) {
  await expect(this.page).toHaveURL(/\/enroll\/pending/, { timeout: 15000 })
})

When('I complete my profile', async function (this: PlaywrightWorld) {
  // Wait for profile form to appear
  const profileHeading = this.page.getByRole('heading', { name: /Complete Your Profile/i })
  await profileHeading.waitFor({ state: 'visible', timeout: 15000 })
  
  // Fill in required profile fields
  // Check if fields are empty before filling (profile may already have some data)
  const firstNameInput = this.page.locator('[name="displayFirstName"]')
  if (await firstNameInput.inputValue() === '') {
    await firstNameInput.fill('Test')
  }
  
  const lastNameInput = this.page.locator('[name="displayLastName"]')
  if (await lastNameInput.inputValue() === '') {
    await lastNameInput.fill('User')
  }
  
  const legalFirstInput = this.page.locator('[name="legalFirstName"]')
  if (await legalFirstInput.inputValue() === '') {
    await legalFirstInput.fill('Test')
  }
  
  const legalLastInput = this.page.locator('[name="legalLastName"]')
  if (await legalLastInput.inputValue() === '') {
    await legalLastInput.fill('User')
  }
  
  const dobInput = this.page.locator('[name="dateOfBirth"]')
  if (await dobInput.inputValue() === '') {
    await dobInput.fill('1990-01-15')
  }
  
  const streetInput = this.page.locator('[name="street"]')
  if (await streetInput.inputValue() === '') {
    await streetInput.fill('123 Test Street')
  }
  
  const cityInput = this.page.locator('[name="city"]')
  if (await cityInput.inputValue() === '') {
    await cityInput.fill('Washington')
  }
  
  const stateInput = this.page.locator('[name="state"]')
  if (await stateInput.inputValue() === '') {
    await stateInput.fill('DC')
  }
  
  const zipInput = this.page.locator('[name="zip"]')
  if (await zipInput.inputValue() === '') {
    await zipInput.fill('20001')
  }
  
  // Submit the form
  await this.page.getByRole('button', { name: /Continue to Checkout/i }).click()
})

Then('I should be on the dashboard', async function (this: PlaywrightWorld) {
  await expect(this.page).toHaveURL(`${BASE_URL}/dashboard`, { timeout: 15000 })
})

Then('I should be asked to create my profile', async function (this: PlaywrightWorld) {
  await expect(this.page.getByRole('heading', { name: /Welcome to CUFC!/i })).toBeVisible({ timeout: 15000 })
  await expect(this.page.getByRole('button', { name: /Create Profile/i })).toBeVisible()
})

Then('I should not see dashboard enrollment options', async function (this: PlaywrightWorld) {
  await expect(this.page.getByRole('heading', { name: 'Class Enrollment' })).toBeHidden()
  await expect(this.page.getByText('Sign Up For An Intro Class')).toBeHidden()
})

When('I choose to sign up for an intro class from the dashboard', async function (this: PlaywrightWorld) {
  await this.page.getByText('Sign Up For An Intro Class').click()
})

Then('I should be asked to complete my profile before enrolling', async function (this: PlaywrightWorld) {
  await expect(this.page.getByText(/Complete your profile.*to enroll/i)).toBeVisible({ timeout: 15000 })
})

When('I follow the complete profile prompt', async function (this: PlaywrightWorld) {
  await this.page.getByRole('link', { name: 'Complete your profile' }).click()
})

When('I create my profile', async function (this: PlaywrightWorld) {
  await this.page.getByRole('heading', { name: /Welcome to CUFC!/i }).waitFor({ state: 'visible', timeout: 15000 })
  await fillRequiredProfileFields(this.page)
  await this.page.getByRole('button', { name: /Create Profile/i }).click()
  await this.page.waitForLoadState('networkidle')
})

Then('I should see my intro class enrollment on the dashboard', async function (this: PlaywrightWorld) {
  if (!this.selectedVariationName) {
    throw new Error('No variation name was captured during class selection')
  }

  const token = await getAccessToken(this.page)
  const response = await this.page.request.get(`${BASE_URL}/api/members/me/intro-enrollment`, {
    headers: { Authorization: `Bearer ${token}` },
  })

  if (!response.ok()) {
    throw new Error(`Failed to fetch intro enrollment: ${response.status()} ${await response.text()}`)
  }

  const body = await response.json() as { enrollment?: { variationName?: string } | null }
  if (!body.enrollment) {
    throw new Error('Intro enrollment API returned no enrollment for the signed-in member')
  }

  await this.page.reload({ waitUntil: 'networkidle' })
  const enrollmentCard = this.page.getByTestId('intro-enrollment-card')
  await expect(enrollmentCard).toContainText(this.selectedVariationName, { timeout: 5000 })
})

Then('I should see the intro class payment in my payment history', async function (this: PlaywrightWorld) {
  if (!this.selectedVariationName) {
    throw new Error('No variation name was captured during class selection')
  }
  const transactionList = this.page.getByTestId('transaction-list')
  await expect(transactionList).toContainText(this.selectedVariationName, { timeout: 10000 })
})

When('I navigate to my payment history', async function (this: PlaywrightWorld) {
  await this.page.getByTestId('tool-card-my-payments').click()
})
