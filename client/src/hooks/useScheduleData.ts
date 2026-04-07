import { useState, useEffect, useCallback } from 'react'
import type { ScheduleData } from '../types/ScheduleTypes'

const API_BASE = '/api'

export function useScheduleData() {
  const [data, setData] = useState<ScheduleData>({
    scheduleItems: [],
    upcomingEvents: [],
    upcomingClosures: []
  })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`${API_BASE}/schedule`)
      if (!response.ok) throw new Error('Failed to fetch schedule')
      const result = await response.json()
      setData(result)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'))
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const refresh = useCallback(() => {
    fetchData()
  }, [fetchData])

  return { ...data, isLoading, error, refresh }
}
