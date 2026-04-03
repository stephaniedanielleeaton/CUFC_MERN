import type { EmailList, SendToListRequest, SendToListResult } from '@cufc/shared'

const API_BASE = '/api'

export interface SendEmailResult extends SendToListResult {
  summary: {
    totalEmails: number
    emailsSent: number
    emailsFailed: number
    emailsBlocked: number
  }
  blockedEmails: string[]
  failedEmails: { email: string; error: string }[]
}

/**
 * Fetch all available email lists with their emails
 */
export async function fetchEmailLists(token: string): Promise<EmailList[]> {
  const response = await fetch(`${API_BASE}/email-lists/`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  if (!response.ok) {
    throw new Error('Failed to fetch email lists')
  }

  return response.json()
}

/**
 * Fetch a special list containing all member emails
 */
export async function fetchAllMemberEmailsList(token: string): Promise<EmailList> {
  const response = await fetch(`${API_BASE}/email-lists/members/all`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  if (!response.ok) {
    throw new Error('Failed to fetch member emails')
  }

  return response.json()
}

/**
 * Send email to selected lists and additional recipients
 */
export async function sendEmailToList(
  token: string,
  request: SendToListRequest
): Promise<SendEmailResult> {
  const response = await fetch(`${API_BASE}/email/send-to-list`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(request),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to send emails')
  }

  return response.json()
}
