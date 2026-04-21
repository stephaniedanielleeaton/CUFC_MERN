import { useState, useEffect } from 'react'
import { useAuth0 } from '@auth0/auth0-react'

interface UseUserRolesResult {
  roles: string[];
  isLoading: boolean;
}

export function useUserRoles(): string[] {
  const { roles } = useUserRolesWithLoading()
  return roles
}

export function useUserRolesWithLoading(): UseUserRolesResult {
  const { isAuthenticated, isLoading: authLoading, getAccessTokenSilently } = useAuth0()
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
        const token = await getAccessTokenSilently()
        const res = await fetch('/api/auth/roles', {
          headers: { Authorization: `Bearer ${token}` }
        })
        if (res.ok) {
          const data = await res.json()
          setRoles(data.roles || [])
        }
      } catch {
        setRoles([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchRoles()
  }, [isAuthenticated, authLoading, getAccessTokenSilently])

  return { roles, isLoading }
}
