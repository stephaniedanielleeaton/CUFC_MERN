export interface DailyAttendanceSummary {
  date: string
  count: number
  dayOfWeek: number
  dayName: string
}

export interface QuarterDayData {
  dayIndex: number
  dayLabel: string
  total: number
  days: number
  average: number
}

export interface QuarterData {
  key: string
  label: string
  total: number
  days: number
  average: number
  change: number | null
  byDay: QuarterDayData[]
}

interface DailySummaryResponse {
  summary: DailyAttendanceSummary[]
}

interface QuarterlySummaryResponse {
  summary: QuarterData[]
}

export async function fetchDailySummary(
  token: string,
  startDate?: string,
  endDate?: string
): Promise<DailyAttendanceSummary[]> {
  const params = new URLSearchParams()
  if (startDate) params.append('startDate', startDate)
  if (endDate) params.append('endDate', endDate)

  const queryString = params.toString()
  const url = '/api/analytics/daily-summary' + (queryString ? '?' + queryString : '')

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!response.ok) {
    throw new Error('Failed to fetch daily attendance summary')
  }
  const data: DailySummaryResponse = await response.json()
  return data.summary || []
}

export async function fetchQuarterlySummary(token: string): Promise<QuarterData[]> {
  const response = await fetch('/api/analytics/quarterly-summary', {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!response.ok) {
    throw new Error('Failed to fetch quarterly summary')
  }
  const data: QuarterlySummaryResponse = await response.json()
  return data.summary || []
}
