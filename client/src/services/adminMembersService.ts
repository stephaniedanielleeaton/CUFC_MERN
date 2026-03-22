import type { MemberProfileDTO } from '@cufc/shared'

interface AttendanceRecord {
  memberId: string
  lastCheckIn: string | null
}

interface SquareStatusResponse {
  activeSubscribers: string[]
  dropIns: string[]
}

interface MembersResponse {
  members: MemberProfileDTO[]
}

export async function fetchAllMembersWithAttendance(
  token: string
): Promise<{ members: MemberProfileDTO[]; lastCheckInMap: Record<string, string | null> }> {
  const headers = { Authorization: `Bearer ${token}` }

  const [membersResponse, attendanceResponse] = await Promise.all([
    fetch('/api/admin/members', { headers }),
    fetch('/api/attendance/recent', { headers }),
  ])

  const membersData: MembersResponse = await membersResponse.json()
  const attendanceData: AttendanceRecord[] = await attendanceResponse.json()

  const members: MemberProfileDTO[] = membersData.members || []

  const lastCheckInMap: Record<string, string | null> = {}
  if (Array.isArray(attendanceData)) {
    attendanceData.forEach((record) => {
      lastCheckInMap[record.memberId] = record.lastCheckIn
    })
  }

  return { members, lastCheckInMap }
}

export async function fetchSquareSubscriptionStatus(
  token: string
): Promise<{ activeSubscriberIds: Set<string>; dropInCustomerIds: Set<string> }> {
  const headers = { Authorization: `Bearer ${token}` }
  const response = await fetch('/api/admin/members/square-status', { headers })
  const data: SquareStatusResponse = await response.json()

  return {
    activeSubscriberIds: new Set<string>(data.activeSubscribers ?? []),
    dropInCustomerIds: new Set<string>(data.dropIns ?? []),
  }
}

export function enrichMembersWithSquareStatus(
  members: MemberProfileDTO[],
  activeSubscriberIds: Set<string>,
  dropInCustomerIds: Set<string>
): MemberProfileDTO[] {
  return members.map((member) => ({
    ...member,
    isSubscriptionActive: !!member.squareCustomerId && activeSubscriberIds.has(member.squareCustomerId),
    hasPaidDropInToday: !!member.squareCustomerId && dropInCustomerIds.has(member.squareCustomerId),
  }))
}

export async function deleteMemberById(token: string, memberId: string): Promise<void> {
  const response = await fetch(`/api/admin/members/${memberId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!response.ok) {
    throw new Error('Failed to delete member')
  }
}

export async function updateMemberById(
  token: string,
  memberId: string,
  updates: Partial<MemberProfileDTO>
): Promise<void> {
  const response = await fetch(`/api/admin/members/${memberId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(updates),
  })
  if (!response.ok) {
    throw new Error('Failed to update member')
  }
}
