import { useAuth0 } from '@auth0/auth0-react'
import { ReactNode, useEffect, useState } from 'react'
import { useGetToken } from '../../hooks/useAuthenticatedFetch'

type RequireAuthProps = {
  children: ReactNode
  requiredRoles?: string[]
  fallback?: ReactNode
}

/**
 * Auth guard that validates the token is still valid by attempting to fetch it.
 * Redirects to login if token refresh fails (expired session).
 */
export function RequireAuth({ children, requiredRoles, fallback }: Readonly<RequireAuthProps>) {
  const { isAuthenticated, isLoading, loginWithRedirect } = useAuth0()
  const getToken = useGetToken()
  const [isValidating, setIsValidating] = useState(true)
  const [roles, setRoles] = useState<string[]>([])
  const [hasValidToken, setHasValidToken] = useState(false)

  useEffect(() => {
    if (isLoading) return

    if (!isAuthenticated) {
      loginWithRedirect({ appState: { returnTo: globalThis.location.pathname } })
      return
    }

    const validateToken = async () => {
      try {
        // Redirect to login if token is expired (this is a protected page)
        const token = await getToken({ redirectOnExpired: true })
        
        // If we need to check roles, fetch them
        if (requiredRoles && requiredRoles.length > 0) {
          const res = await fetch('/api/auth/roles', {
            headers: { Authorization: `Bearer ${token}` }
          })
          if (res.ok) {
            const data = await res.json()
            setRoles(data.roles || [])
          }
        }
        
        setHasValidToken(true)
      } catch {
        // Token expiration triggers redirect via getToken, other errors also redirect
        loginWithRedirect({ appState: { returnTo: globalThis.location.pathname } })
      } finally {
        setIsValidating(false)
      }
    }

    validateToken()
  }, [isAuthenticated, isLoading, getToken, loginWithRedirect, requiredRoles])

  // Still loading auth state or validating token
  if (isLoading || isValidating) {
    return fallback ?? (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    )
  }

  // Check role requirements
  if (requiredRoles && requiredRoles.length > 0) {
    const hasRequiredRole = requiredRoles.some(role => roles.includes(role))
    if (!hasRequiredRole) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[300px] text-center p-4">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Access Denied</h2>
          <p className="text-gray-600">You don&apos;t have permission to view this page.</p>
        </div>
      )
    }
  }

  if (!hasValidToken) {
    return null
  }

  return <>{children}</>
}
