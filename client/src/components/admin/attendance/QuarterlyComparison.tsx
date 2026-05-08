import { useMemo } from 'react'
import type { DailyAttendanceSummary } from '../../../services/analyticsService'

interface QuarterData {
  label: string
  total: number
  days: number
  average: number
  change: number | null
}

function getQuarterLabel(year: number, quarter: number): string {
  return `Q${quarter} ${year}`
}

function getQuarter(dateStr: string): { year: number; quarter: number } {
  const [year, month] = dateStr.split('-').map(Number)
  const quarter = Math.ceil(month / 3)
  return { year, quarter }
}

interface QuarterlyComparisonProps {
  data: DailyAttendanceSummary[]
}

export default function QuarterlyComparison({ data }: Readonly<QuarterlyComparisonProps>) {
  const quarters: QuarterData[] = useMemo(() => {
    if (data.length === 0) return []

    const grouped: Record<string, { total: number; days: number }> = {}
    const order: string[] = []

    data.forEach((d) => {
      const { year, quarter } = getQuarter(d.date)
      const key = `${year}-${quarter}`
      if (!grouped[key]) {
        grouped[key] = { total: 0, days: 0 }
        order.push(key)
      }
      grouped[key].total += d.count
      grouped[key].days += 1
    })

    return order.map((key, index) => {
      const [yearStr, quarterStr] = key.split('-')
      const info = grouped[key]
      const average = Math.round((info.total / info.days) * 10) / 10
      const prev = index > 0 ? grouped[order[index - 1]] : null
      const prevAvg = prev ? prev.total / prev.days : null

      const change = prevAvg !== null && prevAvg > 0
        ? Math.round(((average - prevAvg) / prevAvg) * 100)
        : null

      return {
        label: getQuarterLabel(Number(yearStr), Number(quarterStr)),
        total: info.total,
        days: info.days,
        average,
        change,
      }
    })
  }, [data])

  if (quarters.length === 0) return null

  const maxTotal = Math.max(...quarters.map((q) => q.total))

  return (
    <div className="mb-8">
      <div className="text-sm font-semibold text-gray-700 mb-3">Quarterly Comparison</div>
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {quarters.map((q) => (
            <div key={q.label} className="border border-gray-100 rounded-lg p-3">
              <div className="text-sm font-semibold text-gray-800 mb-2">{q.label}</div>
              <div className="text-2xl font-bold text-medium-pink">{q.total}</div>
              <div className="text-xs text-gray-500 mt-1">
                {q.days} days &middot; {q.average} avg/day
              </div>
              <div className="mt-2">
                <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-violet-400"
                    style={{ width: `${(q.total / maxTotal) * 100}%` }}
                  />
                </div>
              </div>
              {q.change !== null && (
                <div className={`text-xs font-medium mt-2 ${q.change >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {q.change > 0 ? '+' : ''}{q.change}% vs prev quarter
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
