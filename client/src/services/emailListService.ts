export interface EmailListResponse {
  success: boolean
  message: string
}

interface EmailListErrorResponse {
  error: string
}

const EMAIL_LIST_ENDPOINT = '/api/email-lists/promotional/emails' as const

export async function subscribeToNotifications(email: string): Promise<EmailListResponse> {
  const res = await fetch(EMAIL_LIST_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  })

  const data: EmailListResponse | EmailListErrorResponse = await res.json()

  if (!res.ok) {
    const errorData = data as EmailListErrorResponse
    throw new Error(errorData.error || 'Failed to subscribe')
  }

  return data as EmailListResponse
}

export async function unsubscribeFromNotifications(email: string): Promise<EmailListResponse> {
  const res = await fetch(EMAIL_LIST_ENDPOINT, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  })

  const data: EmailListResponse | EmailListErrorResponse = await res.json()

  if (!res.ok) {
    const errorData = data as EmailListErrorResponse
    throw new Error(errorData.error || 'Failed to unsubscribe')
  }

  return data as EmailListResponse
}
