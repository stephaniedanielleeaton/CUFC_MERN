import { useEffect } from 'react'
import { useAuth0 } from '@auth0/auth0-react'
import { isTokenExpiredError } from './useAuthenticatedFetch'

/**
 * App-level guard that detects expired/unrecoverable sessions.
 * If Auth0 considers the user authenticated but the token can no longer
 * be refreshed, it logs them out immediately so the UI never shows a
 * stale "logged in" state.
 */
export function useSessionGuard() {
  const { isAuthenticated, isLoading, getAccessTokenSilently, logout } = useAuth0()

  useEffect(() => {
    if (isLoading || !isAuthenticated) return
    getAccessTokenSilently().catch((error) => {
      if (isTokenExpiredError(error)) {
        logout({ logoutParams: { returnTo: globalThis.location.origin } })
      }
    })
  }, [isAuthenticated, isLoading, getAccessTokenSilently, logout])
}
