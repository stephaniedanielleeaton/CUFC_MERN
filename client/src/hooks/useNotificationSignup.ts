import { useState, useCallback } from 'react'
import { subscribeToNotifications } from '../services/emailListService'

const EMAIL_REGEX: RegExp = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export type FormStatus = 'idle' | 'loading' | 'success' | 'error'

export interface UseNotificationSignupReturn {
  readonly email: string
  readonly status: FormStatus
  readonly error: string | null
  readonly isValidEmail: boolean
  readonly handleEmailChange: (value: string) => void
  readonly handleSubmit: () => Promise<void>
}

export function useNotificationSignup(): UseNotificationSignupReturn {
  const [email, setEmail] = useState<string>('')
  const [status, setStatus] = useState<FormStatus>('idle')
  const [error, setError] = useState<string | null>(null)

  const isValidEmail = EMAIL_REGEX.test(email)

  const handleEmailChange = useCallback((value: string) => {
    setEmail(value)
    if (status === 'error') {
      setError(null)
      setStatus('idle')
    }
  }, [status])

  const handleSubmit = useCallback(async () => {
    if (!isValidEmail) {
      setError('Please enter a valid email address.')
      setStatus('error')
      return
    }

    setStatus('loading')
    setError(null)

    try {
      await subscribeToNotifications(email)
      setStatus('success')
    } catch (err) {
      setError('There was a problem submitting your email. Please try again.')
      setStatus('error')
      console.error('Error submitting email:', err)
    }
  }, [email, isValidEmail])

  return {
    email,
    status,
    error,
    isValidEmail,
    handleEmailChange,
    handleSubmit,
  }
}
