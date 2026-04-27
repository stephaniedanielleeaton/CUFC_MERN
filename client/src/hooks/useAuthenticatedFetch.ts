import { useCallback } from 'react'
import { useAuth0 } from '@auth0/auth0-react'

function isTokenExpiredError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : ''
  return (
    message.includes('login_required') ||
    message.includes('consent_required') ||
    message.includes('Missing Refresh Token')
  )
}

type GetTokenOptions = {
  /** If true, redirects to login when token is expired. Default: false (throws error instead) */
  redirectOnExpired?: boolean
}

/**
 * Returns a wrapper around getAccessTokenSilently.
 * By default, throws an error if token is expired.
 * Pass redirectOnExpired: true to redirect to login instead.
 */
export function useGetToken() {
  const { getAccessTokenSilently, loginWithRedirect } = useAuth0()

  return useCallback(async (options: GetTokenOptions = {}): Promise<string> => {
    try {
      return await getAccessTokenSilently()
    } catch (error) {
      if (isTokenExpiredError(error) && options.redirectOnExpired) {
        loginWithRedirect({ appState: { returnTo: globalThis.location.pathname } })
        throw new Error('Session expired. Redirecting to login...')
      }
      throw error
    }
  }, [getAccessTokenSilently, loginWithRedirect])
}

type FetchOptions = Omit<RequestInit, 'headers'> & {
  headers?: Record<string, string>
}

/**
 * Returns a fetch function that adds the auth token.
 * Throws on token expiration - does NOT auto-redirect.
 * Use RequireAuth wrapper for pages that need fresh auth.
 */
export function useAuthenticatedFetch() {
  const { getAccessTokenSilently } = useAuth0()

  return useCallback(async (url: string, options: FetchOptions = {}): Promise<Response> => {
    const token = await getAccessTokenSilently()
    
    return fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${token}`,
      },
    })
  }, [getAccessTokenSilently])
}
