/**
 * Step definitions for setting up test data via Square API fixtures.
 */

import { Given, When, Then } from '@cucumber/cucumber'
import { expect } from '@playwright/test'
import { PlaywrightWorld } from '../support/world'
import { BASE_URL } from '../support/config'
import { cleanEnrollmentTestAccount } from '../support/auth'

/**
 * Add a test variation to the existing intro class catalog item.
 * Example: Given an intro class "Saturday Morning" exists with 5 spots
 */
Given(
  'an intro class {string} exists with {int} spots',
  async function (this: PlaywrightWorld, className: string, spots: number) {
    this.createdIntroClass = await this.fixtures.introClass.addVariations([
      { name: className, spots },
    ])
    console.log(`[fixtures] Added test variation: ${this.createdIntroClass.variations[0]?.id}`)
  }
)

/**
 * Use an existing intro class variation for enrollment tests.
 * This is needed because the server caches variation IDs, so newly created
 * test variations won't be recognized by the webhook.
 * Example: Given an existing intro class is available with 5 spots
 */
Given('the enrollment test account is clean', async function () {
  await cleanEnrollmentTestAccount(BASE_URL)
})

Given(
  'an existing intro class is available with {int} spots',
  async function (this: PlaywrightWorld, spots: number) {
    this.createdIntroClass = await this.fixtures.introClass.useExistingVariation(spots)
    console.log(`[fixtures] Using existing variation: ${this.createdIntroClass.variations[0]?.name}`)
  }
)

/**
 * Add multiple test variations to the existing intro class catalog item.
 * Example: Given the following intro classes exist:
 *   | name            | spots |
 *   | Saturday AM     | 5     |
 *   | Saturday PM     | 0     |
 */
Given(
  'the following intro classes exist:',
  async function (this: PlaywrightWorld, dataTable: { hashes: () => { name: string; spots: string }[] }) {
    const rows = dataTable.hashes()
    const variations = rows.map(row => ({
      name: row.name,
      spots: Number.parseInt(row.spots, 10),
    }))

    this.createdIntroClass = await this.fixtures.introClass.addVariations(variations)
    console.log(`[fixtures] Added ${variations.length} test variations`)
  }
)

/**
 * Update the spots for a previously created variation.
 * Example: When the "Saturday Morning" class is updated to have 0 spots
 */
When(
  'the {string} class is updated to have {int} spots',
  async function (this: PlaywrightWorld, className: string, spots: number) {
    if (!this.createdIntroClass) {
      throw new Error('No intro class has been created in this scenario')
    }

    const variation = this.createdIntroClass.variations.find(v => v.name === className)
    if (!variation) {
      throw new Error(`Variation "${className}" not found`)
    }

    await this.fixtures.introClass.setSpots(variation.id, spots)
    console.log(`[fixtures] Updated ${className} to ${spots} spots`)
  }
)

/**
 * Verify the displayed spots count for a class.
 * Example: Then I should see "5 spots available" for "Saturday Morning"
 */
Then(
  'I should see {string} for {string}',
  async function (this: PlaywrightWorld, expectedText: string, className: string) {
    const classItem = this.page.locator('button', { hasText: className })
    await expect(classItem).toContainText(expectedText, { timeout: 10000 })
  }
)

/**
 * Verify a class shows as full.
 * Example: Then the "Saturday PM" class should show as full
 */
Then(
  'the {string} class should show as full',
  async function (this: PlaywrightWorld, className: string) {
    const classItem = this.page.locator('button', { hasText: className })
    await expect(classItem).toContainText('Class full', { timeout: 10000 })
  }
)

/**
 * Verify a class can be selected (has spots).
 * Example: Then the "Saturday Morning" class should be selectable
 */
Then(
  'the {string} class should be selectable',
  async function (this: PlaywrightWorld, className: string) {
    const classButton = this.page.locator('button', { hasText: className })
    await expect(classButton).toBeEnabled()
  }
)

/**
 * Verify a class cannot be selected (full).
 * Example: Then the "Saturday PM" class should not be selectable
 */
Then(
  'the {string} class should not be selectable',
  async function (this: PlaywrightWorld, className: string) {
    const classButton = this.page.locator('button', { hasText: className })
    await expect(classButton).toBeDisabled()
  }
)
