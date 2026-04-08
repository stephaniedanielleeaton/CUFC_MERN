import type { EmailList, SendToListRequest, SendToListResult } from '@cufc/shared'

const API_BASE = '/api'

export interface BatchProgress {
  jobId: string
  batchNumber: number
  totalBatches: number
  batchSize: number
  successCount: number
  failureCount: number
  totalProcessed: number
  totalEmails: number
  failures: { email: string; error: string }[]
  status: 'processing' | 'completed' | 'error'
}

export interface SendEmailResult extends SendToListResult {
  summary: {
    totalEmails: number
    emailsSent: number
    emailsFailed: number
    emailsBlocked: number
  }
  blockedEmails: string[]
  failedEmails: { email: string; error: string }[]
  jobId?: string
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
 * Start async email job and return jobId for streaming progress
 */
export async function startEmailJobAsync(
  token: string,
  request: SendToListRequest
): Promise<{ jobId: string; message: string }> {
  const response = await fetch(`${API_BASE}/email/send-to-list/async`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(request),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to start email job')
  }

  return response.json()
}

/**
 * Connect to SSE stream for email send progress
 */
export function connectToEmailProgressStream(
  token: string,
  jobId: string,
  onProgress: (progress: BatchProgress) => void,
  onComplete?: () => void,
  onError?: (error: string) => void
): () => void {
  // Pass token as query param since EventSource doesn't support custom headers
  const url = `${API_BASE}/email/send-to-list/stream?jobId=${encodeURIComponent(jobId)}&token=${encodeURIComponent(token)}`
  const eventSource = new EventSource(url)

  eventSource.onopen = () => {
    console.log('SSE connection opened for job:', jobId)
  }

  eventSource.onmessage = (event) => {
    const progress: BatchProgress = JSON.parse(event.data)
    onProgress(progress)

    if (progress.status === 'completed') {
      eventSource.close()
      onComplete?.()
    }
  }

  eventSource.onerror = () => {
    onError?.('Connection error')
    eventSource.close()
  }

  // Return cleanup function
  return () => {
    eventSource.close()
  }
}

/**
 * Send email to selected lists and additional recipients (legacy, non-streaming)
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
