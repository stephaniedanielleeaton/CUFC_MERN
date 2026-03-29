import { useState, useCallback } from 'react'
import { unsubscribeFromNotifications } from '../services/emailListService'
import type { FormStatus } from './useNotificationSignup'

const EMAIL_REGEX: RegExp = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export interface UseUnsubscribeReturn {
  readonly email: string
  readonly status: FormStatus
  readonly error: string | null
  readonly isValidEmail: boolean
  readonly handleEmailChange: (value: string) => void
  readonly handleSubmit: () => Promise<void>
  readonly reset: () => void
}

export function useUnsubscribe(): UseUnsubscribeReturn {
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
      await unsubscribeFromNotifications(email)
      setStatus('success')
    } catch (err) {
      setError('There was a problem processing your request. Please try again.')
      setStatus('error')
      console.error('Error unsubscribing:', err)
    }
  }, [email, isValidEmail])

  const reset = useCallback(() => {
    setEmail('')
    setStatus('idle')
    setError(null)
  }, [])

  return {
    email,
    status,
    error,
    isValidEmail,
    handleEmailChange,
    handleSubmit,
    reset,
  }
}
