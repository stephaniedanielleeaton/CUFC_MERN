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

/**
 * Scenario-scoped fixture access. Square dependencies are initialized only when a
 * scenario uses them, so unrelated scenarios do not require Square credentials.
 */
export class TestFixtures {
  private squareClient: SquareTestClient | null = null
  private introClassFixture: IntroClassFixture | null = null
  private enrollmentAccountFixture: EnrollmentAccountFixture | null = null

  private getSquareClient(): SquareTestClient {
    if (this.squareClient) {
      return this.squareClient
    }

    const accessToken = process.env.SQUARE_ACCESS_TOKEN
    const locationId = process.env.SQUARE_RETAIL_LOCATION_ID

    if (!accessToken || !locationId) {
      throw new Error(
        'Missing required env vars for test fixtures: SQUARE_ACCESS_TOKEN, SQUARE_RETAIL_LOCATION_ID'
      )
    }

    this.squareClient = new SquareTestClient({
      accessToken,
      environment: 'sandbox',
      locationId,
    })

    return this.squareClient
  }

  private getIntroClassCatalogId(): string {
    const catalogId = process.env.INTRO_CLASS_CATALOG_OBJECT_ID
    if (!catalogId) {
      throw new Error('Missing required env var: INTRO_CLASS_CATALOG_OBJECT_ID')
    }
    return catalogId
  }

  get introClass(): IntroClassFixture {
    this.introClassFixture ??= new IntroClassFixture(
      this.getSquareClient(),
      this.getIntroClassCatalogId()
    )
    return this.introClassFixture
  }

  get enrollmentAccount(): EnrollmentAccountFixture {
    this.enrollmentAccountFixture ??= new EnrollmentAccountFixture({
      baseUrl: BASE_URL,
      squareClient: this.getSquareClient(),
    })
    return this.enrollmentAccountFixture
  }

  async cleanupTestVariations(): Promise<number> {
    return this.getSquareClient().cleanupTestVariations()
  }

  async deleteSquareCustomerByEmail(email: string): Promise<boolean> {
    return this.getSquareClient().deleteCustomerByEmail(email)
  }
}
