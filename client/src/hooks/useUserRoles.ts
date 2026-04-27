import { useState, useEffect } from 'react'
import { useAuth0 } from '@auth0/auth0-react'
import { useAuthenticatedFetch } from './useAuthenticatedFetch'

interface UseUserRolesResult {
  roles: string[];
  isLoading: boolean;
}

export function useUserRoles(): string[] {
  const { roles } = useUserRolesWithLoading()
  return roles
}

export function useUserRolesWithLoading(): UseUserRolesResult {
  const { isAuthenticated, isLoading: authLoading } = useAuth0()
  const authFetch = useAuthenticatedFetch()
  const [roles, setRoles] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (authLoading) {
      return
    }

    if (!isAuthenticated) {
      setRoles([])
      setIsLoading(false)
      return
    }

    const fetchRoles = async () => {
      try {
        const res = await authFetch('/api/auth/roles')
        if (res.ok) {
          const data = await res.json()
          setRoles(data.roles || [])
        }
      } catch {
        // Token expiration handled by authFetch - just catch to prevent unhandled rejection
        setRoles([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchRoles()
  }, [isAuthenticated, authLoading, authFetch])

  return { roles, isLoading }
}
