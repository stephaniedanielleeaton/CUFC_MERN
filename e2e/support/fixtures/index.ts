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

import {
  BASE_URL,
  INTRO_CLASS_CATALOG_OBJECT_ID,
  SQUARE_ACCESS_TOKEN,
  SQUARE_RETAIL_LOCATION_ID,
} from '../config'
import { SquareTestClient } from './square-client'
import { IntroClassFixture } from './intro-class-fixture'
import { EnrollmentAccountFixture } from './enrollment-account-fixture'

/**
 * Scenario-scoped E2E fixtures.
 */
export class TestFixtures {
  private readonly squareClient = new SquareTestClient({
      accessToken: SQUARE_ACCESS_TOKEN,
      environment: 'sandbox',
      locationId: SQUARE_RETAIL_LOCATION_ID,
  })

  readonly introClass = new IntroClassFixture(
    this.squareClient,
    INTRO_CLASS_CATALOG_OBJECT_ID
  )

  readonly enrollmentAccount = new EnrollmentAccountFixture({
      baseUrl: BASE_URL,
      squareClient: this.squareClient,
  })

  async cleanupTestVariations(): Promise<number> {
    return this.squareClient.cleanupTestVariations()
  }

  async deleteSquareCustomerByEmail(email: string): Promise<boolean> {
    return this.squareClient.deleteCustomerByEmail(email)
  }
}
