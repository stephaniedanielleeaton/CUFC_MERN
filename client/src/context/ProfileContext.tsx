import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react'
import { useAuth0 } from '@auth0/auth0-react'
import type { MemberProfileDTO, MemberProfileFormInput } from '@cufc/shared'
import { useAuthenticatedFetch } from '../hooks/useAuthenticatedFetch'

type MemberProfileContextType = {
  profile: MemberProfileFormInput | null
  loading: boolean
  error: string | null
  refreshProfile: () => Promise<void>
  updateProfile: (data: MemberProfileFormInput) => void
}

const MemberProfileContext = createContext<MemberProfileContextType | undefined>(undefined)

export function useMemberProfile() {
  const ctx = useContext(MemberProfileContext)
  if (!ctx) throw new Error('useMemberProfile must be used within a MemberProfileProvider')
  return ctx
}

function toFormInput(p: MemberProfileDTO): MemberProfileFormInput {
  return { ...p, profileId: String(p._id) } as MemberProfileFormInput
}

export function MemberProfileProvider({ children }: Readonly<{ children: ReactNode }>) {
  const { isAuthenticated, isLoading: authLoading } = useAuth0()
  const authFetch = useAuthenticatedFetch()
  const [profile, setProfile] = useState<MemberProfileFormInput | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProfile = useCallback(async () => {
    if (authLoading) return

    if (!isAuthenticated) {
      setProfile(null)
      setLoading(false)
      setError(null)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = await authFetch('/api/members/me')
      if (!res.ok) throw new Error('Failed to fetch profile')
      const data = await res.json()
      const fetched: MemberProfileDTO | null = data.profile ?? null
      setProfile(fetched ? toFormInput(fetched) : null)
    } catch (err) {
      // Token expiration just fails silently - user can still browse public pages
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      setProfile(null)
    } finally {
      setLoading(false)
    }
  }, [isAuthenticated, authLoading, authFetch])

  useEffect(() => {
    fetchProfile()
  }, [fetchProfile])

  const updateProfile = useCallback((data: MemberProfileFormInput) => {
    setProfile(data)
  }, [])

  const contextValue = useMemo(
    () => ({ profile, loading, error, refreshProfile: fetchProfile, updateProfile }),
    [profile, loading, error, fetchProfile, updateProfile]
  )

  return (
    <MemberProfileContext.Provider value={contextValue}>
      {children}
    </MemberProfileContext.Provider>
  )
}
