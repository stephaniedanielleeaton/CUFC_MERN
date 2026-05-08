import { useState, useMemo, useEffect } from 'react'
import { useAuth0 } from '@auth0/auth0-react'
import { fetchDailySummary, DailyAttendanceSummary } from '../services/analyticsService'
import { toInputDate } from '../utils/analyticsDateUtils'
import { PresetDays } from '../constants/analyticsConfig'

function getDefaultStartDate(): string {
  const d = new Date()
  d.setDate(d.getDate() - 30)
  return toInputDate(d)
}

export interface AttendanceStats {
  average: number
  peak: number | null
  totalCheckIns: number
}

export function useAttendanceAnalytics() {
  const { getAccessTokenSilently } = useAuth0()
  const [data, setData] = useState<DailyAttendanceSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedDay, setSelectedDay] = useState<'all' | number>('all')
  const [startDate, setStartDate] = useState<string>(getDefaultStartDate)
  const [endDate, setEndDate] = useState<string>(() => toInputDate(new Date()))

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        setLoading(true)
        const token = await getAccessTokenSilently()
        const summary = await fetchDailySummary(
          token,
          startDate || undefined,
          endDate || undefined,
        )
        if (!cancelled) {
          setData(summary)
          setError(null)
        }
      } catch (err) {
        if (!cancelled) {
          setError('Failed to load attendance data')
          console.error(err)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [getAccessTokenSilently, startDate, endDate])

  const filtered = useMemo(() => {
    if (selectedDay === 'all') return data
    return data.filter((d) => d.dayOfWeek === selectedDay)
  }, [data, selectedDay])

  const stats: AttendanceStats = useMemo(() => {
    if (filtered.length === 0) {
      return { average: 0, peak: null, totalCheckIns: 0 }
    }

    const totalCheckIns = filtered.reduce((sum, d) => sum + d.count, 0)
    const average = Math.round((totalCheckIns / filtered.length) * 10) / 10
    const peak = Math.max(...filtered.map((d) => d.count))

    return { average, peak, totalCheckIns }
  }, [filtered])

  const maxCount = useMemo(() => {
    if (filtered.length === 0) return 1
    return Math.max(...filtered.map((d) => d.count))
  }, [filtered])

  function applyPreset(days: PresetDays) {
    const end = new Date()
    if (days === 'all') {
      setStartDate('')
      setEndDate('')
      return
    }
    if (days === 'year') {
      setStartDate(toInputDate(new Date(end.getFullYear(), 0, 1)))
      setEndDate(toInputDate(end))
      return
    }
    const start = new Date(end)
    start.setDate(end.getDate() - days)
    setStartDate(toInputDate(start))
    setEndDate(toInputDate(end))
  }

  function isPresetActive(presetDays: PresetDays): boolean {
    if (presetDays === 'all') return startDate === '' && endDate === ''
    const end = new Date()
    const expectedEnd = toInputDate(end)
    let expectedStart: string
    if (presetDays === 'year') {
      expectedStart = toInputDate(new Date(end.getFullYear(), 0, 1))
    } else {
      const start = new Date(end)
      start.setDate(end.getDate() - presetDays)
      expectedStart = toInputDate(start)
    }
    return startDate === expectedStart && endDate === expectedEnd
  }

  return {
    loading,
    error,
    data,
    filtered,
    stats,
    maxCount,
    selectedDay,
    setSelectedDay,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    applyPreset,
    isPresetActive,
  }
}
