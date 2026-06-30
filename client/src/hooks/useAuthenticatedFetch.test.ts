import { describe, it, expect } from 'vitest'
import { isTokenExpiredError } from './useAuthenticatedFetch'

describe('isTokenExpiredError', () => {
  it('returns true for login_required', () => {
    expect(isTokenExpiredError(new Error('login_required'))).toBe(true)
  })

  it('returns true for consent_required', () => {
    expect(isTokenExpiredError(new Error('consent_required'))).toBe(true)
  })

  it('returns true for Missing Refresh Token', () => {
    expect(isTokenExpiredError(new Error('Missing Refresh Token'))).toBe(true)
  })

  it('returns false for unrelated errors', () => {
    expect(isTokenExpiredError(new Error('Network error'))).toBe(false)
  })

  it('returns false for non-Error values', () => {
    expect(isTokenExpiredError('login_required')).toBe(false)
    expect(isTokenExpiredError(null)).toBe(false)
    expect(isTokenExpiredError(undefined)).toBe(false)
  })
})
