import { useState, useEffect } from 'react'
import type { IntroClassDTO } from '@cufc/shared'

export function useIntroClassOfferings() {
  const [introClassData, setIntroClassData] = useState<IntroClassDTO | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchIntroClassOfferings = async () => {
      try {
        setIsLoading(true)
        const response = await fetch('/api/intro-class-offerings')
        
        if (!response.ok) {
          throw new Error('Failed to fetch intro class offerings')
        }
        
        const data: IntroClassDTO = await response.json()
        setIntroClassData(data)
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred')
        console.error('Error fetching intro class offerings:', err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchIntroClassOfferings()
  }, [])

  return { introClassData, isLoading, error }
}
