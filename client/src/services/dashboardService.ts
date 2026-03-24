import type { MemberSubscriptionDTO, IntroEnrollmentDTO, LastCheckInDTO, Transaction, AttendanceRecord } from '@cufc/shared'

export type { MemberSubscriptionDTO, IntroEnrollmentDTO, LastCheckInDTO, Transaction, AttendanceRecord } from '@cufc/shared'
export type IntroEnrollment = IntroEnrollmentDTO

export interface CreateProfilePayload {
  displayFirstName: string
  displayLastName: string
  personalInfo?: { email: string }
  guardian?: { firstName: string; lastName: string }
}

export interface DropInCheckoutPayload {
  memberProfileId: string
  redirectUrl: string
}

export interface DropInCheckoutResponse {
  checkoutUrl: string
  error?: string
}

export async function fetchMemberSubscriptions(
  token: string,
  memberProfileId: string
): Promise<MemberSubscriptionDTO[]> {
  const res = await fetch(`/api/members/me/subscriptions?memberProfileId=${memberProfileId}`, {
    headers: { Authorization: `Bearer ${token}` }
  })
  if (!res.ok) {
    return []
  }
  const data = await res.json()
  return Array.isArray(data) ? data : []
}

export async function fetchLastCheckIn(
  token: string,
  memberProfileId: string
): Promise<LastCheckInDTO | null> {
  const res = await fetch(`/api/members/last-checkin?memberProfileId=${memberProfileId}`, {
    headers: { Authorization: `Bearer ${token}` }
  })
  const data = await res.json()
  if (res.ok && data.lastCheckIn?.timestamp) {
    return data.lastCheckIn
  }
  return null
}

export async function fetchIntroEnrollment(
  token: string
): Promise<IntroEnrollmentDTO | null> {
  const res = await fetch('/api/members/me/intro-enrollment', {
    headers: { Authorization: `Bearer ${token}` }
  })
  const data = await res.json()
  return data.enrollment ?? null
}

export async function createMemberProfile(
  token: string,
  payload: CreateProfilePayload
): Promise<void> {
  const res = await fetch('/api/members/me', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  })
  if (!res.ok) {
    throw new Error('Failed to create profile')
  }
}

export async function createDropInCheckout(
  token: string,
  payload: DropInCheckoutPayload
): Promise<DropInCheckoutResponse> {
  const res = await fetch('/api/checkout/dropin', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  })
  const data = await res.json()
  if (!res.ok) {
    throw new Error(data.error || 'Failed to create checkout')
  }
  return data
}

export async function getSubscriptionCheckoutUrl(
  token: string
): Promise<string> {
  const res = await fetch('/api/checkout/subscription', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({})
  })
  const data = await res.json()
  if (!res.ok) {
    throw new Error(data.error || 'Failed to get checkout URL')
  }
  return data.checkoutUrl
}

export async function fetchTransactions(
  token: string
): Promise<Transaction[]> {
  const res = await fetch('/api/members/me/transactions', {
    headers: { Authorization: `Bearer ${token}` }
  })
  if (!res.ok) {
    return []
  }
  const data = await res.json()
  return Array.isArray(data) ? data : []
}

export async function fetchAttendanceHistory(
  token: string
): Promise<AttendanceRecord[]> {
  const res = await fetch('/api/members/me/attendance', {
    headers: { Authorization: `Bearer ${token}` }
  })
  if (!res.ok) {
    return []
  }
  const data = await res.json()
  return Array.isArray(data) ? data : []
}
