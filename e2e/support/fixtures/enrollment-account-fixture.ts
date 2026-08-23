import { APIRequestContext, request } from 'playwright'
import { ensureAdminAuth, getAdminAccessToken } from '../auth'
import { TEST_MEMBER_EMAIL } from '../config'
import { SquareTestClient } from './square-client'

interface EnrollmentAccountFixtureOptions {
  baseUrl: string
  squareClient: SquareTestClient
}

interface MembersResponse {
  members: { _id: string; personalInfo?: { email?: string } }[]
}

export class EnrollmentAccountFixture {
  private readonly baseUrl: string
  private readonly squareClient: SquareTestClient

  constructor(options: EnrollmentAccountFixtureOptions) {
    this.baseUrl = options.baseUrl
    this.squareClient = options.squareClient
  }

  async clean(): Promise<void> {
    const email = TEST_MEMBER_EMAIL

    await ensureAdminAuth(this.baseUrl)
    await this.squareClient.deleteCustomerByEmail(email)

    const apiContext = await this.createAdminApiContext()
    try {
      const membersResponse = await apiContext.get('/api/admin/members')
      if (!membersResponse.ok()) {
        throw new Error(`Failed to fetch members for enrollment test cleanup: ${membersResponse.status()} ${await membersResponse.text()}`)
      }

      const membersBody = await membersResponse.json() as MembersResponse
      const profile = membersBody.members.find(member => member.personalInfo?.email === email)
      if (!profile) {
        console.log('[fixtures] Enrollment test profile not found — no profile cleanup needed')
        return
      }

      const deleteResponse = await apiContext.delete(`/api/admin/members/${profile._id}`)
      if (!deleteResponse.ok() && deleteResponse.status() !== 404) {
        throw new Error(`Failed to delete enrollment test profile: ${deleteResponse.status()} ${await deleteResponse.text()}`)
      }

      console.log(`[fixtures] Deleted enrollment test profile ${profile._id}`)
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
