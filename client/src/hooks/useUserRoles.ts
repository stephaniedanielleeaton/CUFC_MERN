import { useState, useEffect } from 'react'
import { useAuth0 } from '@auth0/auth0-react'

export function useUserRoles(): string[] {
  const { isAuthenticated, getAccessTokenSilently } = useAuth0()
  const [roles, setRoles] = useState<string[]>([])

  useEffect(() => {
    if (!isAuthenticated) {
      setRoles([])
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
      }
    }

    fetchRoles()
  }, [isAuthenticated, getAccessTokenSilently])

  return roles
}
