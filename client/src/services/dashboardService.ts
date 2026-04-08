import { API_ENDPOINTS } from '../constants/api'
import type { MemberSubscriptionDTO, IntroEnrollmentDTO, LastCheckInDTO, Transaction, AttendanceRecord } from '@cufc/shared'

export type { MemberSubscriptionDTO, IntroEnrollmentDTO, LastCheckInDTO, Transaction, AttendanceRecord } from '@cufc/shared'

export interface CreateProfilePayload {
  displayFirstName: string
  displayLastName: string
  personalInfo?: { email: string }
  guardian?: { firstName: string; lastName: string }
}

export async function fetchMemberSubscriptions(
  token: string,
  memberProfileId: string
): Promise<MemberSubscriptionDTO[]> {
  const res = await fetch(`${API_ENDPOINTS.MEMBERS.SUBSCRIPTIONS}?memberProfileId=${memberProfileId}`, {
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
  const res = await fetch(`${API_ENDPOINTS.MEMBERS.LAST_CHECKIN}?memberProfileId=${memberProfileId}`, {
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
  const res = await fetch(API_ENDPOINTS.MEMBERS.INTRO_ENROLLMENT, {
    headers: { Authorization: `Bearer ${token}` }
  })
  const data = await res.json()
  return data.enrollment ?? null
}

export async function createMemberProfile(
  token: string,
  payload: CreateProfilePayload
): Promise<void> {
  const res = await fetch(API_ENDPOINTS.MEMBERS.ME, {
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

export async function fetchTransactions(
  token: string
): Promise<Transaction[]> {
  const res = await fetch(API_ENDPOINTS.MEMBERS.TRANSACTIONS, {
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
  const res = await fetch(API_ENDPOINTS.MEMBERS.ATTENDANCE, {
    headers: { Authorization: `Bearer ${token}` }
  })
  if (!res.ok) {
    return []
  }
  const data = await res.json()
  return Array.isArray(data) ? data : []
}
