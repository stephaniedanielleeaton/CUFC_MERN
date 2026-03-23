import { useEffect, useState } from 'react'
import { useAuth0 } from '@auth0/auth0-react'
import { fetchIntroEnrollment, type IntroEnrollmentDTO } from '../services/dashboardService'

export { type IntroEnrollmentDTO } from '../services/dashboardService'

type Result = {
  enrollment: IntroEnrollmentDTO | null
  loading: boolean
}

export function useIntroEnrollment(profileId: string | undefined): Result {
  const { getAccessTokenSilently, isAuthenticated } = useAuth0()
  const [enrollment, setEnrollment] = useState<IntroEnrollmentDTO | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!profileId || !isAuthenticated) return
    
    const loadEnrollment = async () => {
      setLoading(true)
      try {
        const token = await getAccessTokenSilently()
        const data = await fetchIntroEnrollment(token)
        setEnrollment(data)
      } catch {
        setEnrollment(null)
      } finally {
        setLoading(false)
      }
    }
    
    loadEnrollment()
  }, [profileId, isAuthenticated, getAccessTokenSilently])

  return { enrollment, loading }
}
