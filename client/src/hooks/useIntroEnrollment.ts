import { useEffect, useState } from 'react'
import { useAuth0 } from '@auth0/auth0-react'
import { fetchIntroEnrollment, type IntroEnrollmentDTO } from '../services/dashboardService'
import { useGetToken } from './useAuthenticatedFetch'

export type { IntroEnrollmentDTO } from '../services/dashboardService'
export type IntroEnrollment = IntroEnrollmentDTO

type Result = {
  enrollment: IntroEnrollment | null
  loading: boolean
}

export function useIntroEnrollment(profileId: string | undefined): Result {
  const { isAuthenticated } = useAuth0()
  const getToken = useGetToken()
  const [enrollment, setEnrollment] = useState<IntroEnrollment | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!profileId || !isAuthenticated) return
    
    const loadEnrollment = async () => {
      setLoading(true)
      try {
        const token = await getToken()
        const data = await fetchIntroEnrollment(token)
        setEnrollment(data)
      } catch {
        // Token expiration handled by getToken
        setEnrollment(null)
      } finally {
        setLoading(false)
      }
    }
    
    loadEnrollment()
  }, [profileId, isAuthenticated, getToken])

  return { enrollment, loading }
}
