/**
 * E2E Test Fixtures
 * 
 * These fixtures interact directly with Square's API to set up test data.
 * They do not touch production server code.
 */

export { SquareTestClient } from './square-client'
export { IntroClassFixture } from './intro-class-fixture'
export { EnrollmentAccountFixture } from './enrollment-account-fixture'
export type { IntroClassVariation, CreatedIntroClass } from './intro-class-fixture'

import { BASE_URL } from '../config'
import { SquareTestClient } from './square-client'
import { IntroClassFixture } from './intro-class-fixture'
import { EnrollmentAccountFixture } from './enrollment-account-fixture'

export interface TestFixtures {
  introClass: IntroClassFixture
  enrollmentAccount: EnrollmentAccountFixture
  cleanupTestVariations(): Promise<number>
  deleteSquareCustomerByEmail(email: string): Promise<boolean>
}

/**
 * Creates test fixtures lazily - only validates env vars when fixtures are actually used.
 * This allows scenarios that don't need fixtures to run without Square credentials.
 */
export function createTestFixtures(): TestFixtures {
  let _introClass: IntroClassFixture | null = null
  let _enrollmentAccount: EnrollmentAccountFixture | null = null

  const getClient = (): SquareTestClient => {
    const accessToken = process.env.SQUARE_ACCESS_TOKEN
    const locationId = process.env.SQUARE_RETAIL_LOCATION_ID

    if (!accessToken || !locationId) {
      throw new Error(
        'Missing required env vars for test fixtures: SQUARE_ACCESS_TOKEN, SQUARE_RETAIL_LOCATION_ID'
      )
    }

    return new SquareTestClient({
      accessToken,
      environment: 'sandbox',
      locationId,
    })
  }

  const getIntroClassCatalogId = (): string => {
    const catalogId = process.env.INTRO_CLASS_CATALOG_OBJECT_ID
    if (!catalogId) {
      throw new Error('Missing required env var: INTRO_CLASS_CATALOG_OBJECT_ID')
    }
    return catalogId
  }

  return {
    get introClass(): IntroClassFixture {
      _introClass ??= new IntroClassFixture(getClient(), getIntroClassCatalogId())
      return _introClass
    },
    get enrollmentAccount(): EnrollmentAccountFixture {
      _enrollmentAccount ??= new EnrollmentAccountFixture({
        baseUrl: BASE_URL,
        squareClient: getClient(),
      })
      return _enrollmentAccount
    },
    async cleanupTestVariations(): Promise<number> {
      return getClient().cleanupTestVariations()
    },
    async deleteSquareCustomerByEmail(email: string): Promise<boolean> {
      return getClient().deleteCustomerByEmail(email)
    },
  }
}
