import { APIRequestContext, request } from 'playwright'
import { ensureAdminAuth, getAdminAccessToken } from '../auth'
import { SquareTestClient } from './square-client'

interface EnrollmentAccountFixtureOptions {
  baseUrl: string
  squareClient: SquareTestClient
}

interface MemberProfileResponse {
  profile: { _id: string; profileComplete?: boolean; squareCustomerId?: string } | null
}

export class EnrollmentAccountFixture {
  private readonly baseUrl: string
  private readonly squareClient: SquareTestClient

  constructor(options: EnrollmentAccountFixtureOptions) {
    this.baseUrl = options.baseUrl
    this.squareClient = options.squareClient
  }

  async clean(): Promise<void> {
    const email = process.env.E2E_ADMIN_EMAIL
    const password = process.env.E2E_ADMIN_PASSWORD

    if (!email || !password) {
      console.log('[fixtures] Admin credentials not set — skipping enrollment test account cleanup')
      return
    }

    await ensureAdminAuth(this.baseUrl)
    await this.squareClient.deleteCustomerByEmail(email)

    const apiContext = await this.createAdminApiContext()
    try {
      const profileResponse = await apiContext.get('/api/members/me')
      if (!profileResponse.ok()) {
        throw new Error(`Failed to fetch enrollment test profile: ${profileResponse.status()} ${await profileResponse.text()}`)
      }

      const profileBody = await profileResponse.json() as MemberProfileResponse
      if (!profileBody.profile) {
        console.log('[fixtures] Enrollment test profile not found — no profile cleanup needed')
        return
      }

      const profile = profileBody.profile
      const deleteResponse = await apiContext.delete(`/api/admin/members/${profile._id}`)
      if (!deleteResponse.ok() && deleteResponse.status() !== 404) {
        throw new Error(`Failed to delete enrollment test profile: ${deleteResponse.status()} ${await deleteResponse.text()}`)
      }

      console.log(`[fixtures] Deleted enrollment test profile ${profile._id}`)
    } finally {
      await apiContext.dispose()
    }
  }

  async createCompletedProfile(): Promise<string> {
    const email = process.env.E2E_ADMIN_EMAIL
    const password = process.env.E2E_ADMIN_PASSWORD

    if (!email || !password) {
      throw new Error('Missing required env vars: E2E_ADMIN_EMAIL, E2E_ADMIN_PASSWORD')
    }

    await this.clean()

    const apiContext = await this.createAdminApiContext()
    try {
      const profileResponse = await apiContext.post('/api/members/me', {
        data: {
          displayFirstName: 'Test',
          displayLastName: 'User',
          personalInfo: {
            legalFirstName: 'Test',
            legalLastName: 'User',
            email,
            dateOfBirth: '1990-01-15',
            address: {
              street: '123 Test Street',
              city: 'Washington',
              state: 'DC',
              zip: '20001',
            },
          },
          profileComplete: true,
        },
      })

      if (!profileResponse.ok() && profileResponse.status() !== 409) {
        throw new Error(`Failed to create completed enrollment test profile: ${profileResponse.status()} ${await profileResponse.text()}`)
      }

      console.log(`[fixtures] Created completed enrollment test profile for ${email}`)
      return email
    } finally {
      await apiContext.dispose()
    }
  }

  private async createAdminApiContext(): Promise<APIRequestContext> {
    const accessToken = getAdminAccessToken(this.baseUrl)
    if (!accessToken) {
      throw new Error('Cached admin access token not found')
    }

    return request.newContext({
      baseURL: this.baseUrl,
      extraHTTPHeaders: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    })
  }
}
