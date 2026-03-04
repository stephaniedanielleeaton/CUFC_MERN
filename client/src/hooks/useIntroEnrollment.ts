import { useEffect, useState } from 'react'
import { useAuth0 } from '@auth0/auth0-react'

export type IntroEnrollment = {
  orderId: string
  itemName: string
  variationName: string
}

type Result = {
  enrollment: IntroEnrollment | null
  loading: boolean
}

export function useIntroEnrollment(profileId: string | undefined): Result {
  const { getAccessTokenSilently, isAuthenticated } = useAuth0()
  const [enrollment, setEnrollment] = useState<IntroEnrollment | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!profileId || !isAuthenticated) return
    
    const fetchEnrollment = async () => {
      setLoading(true)
      try {
        const token = await getAccessTokenSilently()
        const res = await fetch("/api/members/me/intro-enrollment", {
          headers: { Authorization: `Bearer ${token}` }
        })
        const data = await res.json()
        setEnrollment(data.enrollment ?? null)
      } catch {
        setEnrollment(null)
      } finally {
        setLoading(false)
      }
    }
    
    fetchEnrollment()
  }, [profileId, isAuthenticated, getAccessTokenSilently])

  return { enrollment, loading }
}
