import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react'
import { useAuth0 } from '@auth0/auth0-react'
import type { MemberProfileDTO, MemberProfileFormInput } from '@cufc/shared'

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
  const { isAuthenticated, isLoading: authLoading, getAccessTokenSilently, loginWithRedirect } = useAuth0()
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
      const token = await getAccessTokenSilently()
      const res = await fetch('/api/members/me', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
      if (!res.ok) throw new Error('Failed to fetch profile')
      const data = await res.json()
      const fetched: MemberProfileDTO | null = data.profile ?? null
      setProfile(fetched ? toFormInput(fetched) : null)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      // Silent auth fails on Safari/iPhone due to third-party cookie blocking
      // Trigger a fresh login instead of showing an error
      if (errorMessage.includes('login_required') || errorMessage.includes('consent_required')) {
        loginWithRedirect()
        return
      }
      setError(errorMessage)
      setProfile(null)
    } finally {
      setLoading(false)
    }
  }, [isAuthenticated, authLoading, getAccessTokenSilently, loginWithRedirect])

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
