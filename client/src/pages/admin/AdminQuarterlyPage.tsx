import { useState, useEffect } from 'react'
import { useAuth0 } from '@auth0/auth0-react'
import { fetchQuarterlySummary, QuarterData } from '../../services/analyticsService'
import { DAY_CONFIG } from '../../constants/analyticsConfig'

export default function AdminQuarterlyPage() {
  const { getAccessTokenSilently } = useAuth0()
  const [quarters, setQuarters] = useState<QuarterData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        setLoading(true)
        const token = await getAccessTokenSilently()
        const summary = await fetchQuarterlySummary(token)
        if (!cancelled) {
          setQuarters(summary)
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
  }, [getAccessTokenSilently])

  if (loading) {
    return <div className="text-center py-12 text-gray-400">Loading data...</div>
  }

  if (error) {
    return <div className="text-center py-12 text-red-500">{error}</div>
  }

  if (quarters.length === 0) {
    return <div className="text-center py-12 text-gray-400">No attendance data available.</div>
  }

  const displayQuarters = quarters

  return (
    <div>
      {/* Quarter summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {displayQuarters.map((q) => (
          <div key={q.key} className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-semibold text-gray-800">{q.label}</div>
              {q.change !== null && (
                <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${q.change >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                  {q.change > 0 ? '+' : ''}{q.change}%
                </span>
              )}
            </div>
            <div className="text-2xl font-bold text-medium-pink">{q.total}</div>
            <div className="text-xs text-gray-500 mt-1">{q.average} avg/day &middot; {q.days} days</div>
          </div>
        ))}
      </div>

      {/* Day-of-week comparison table across all quarters */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <div className="text-sm font-semibold text-gray-700">Average Check-ins by Day of Week</div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 font-semibold text-gray-700">Day</th>
                {displayQuarters.map((q) => (
                  <th key={q.key} className="text-center px-4 py-3 font-semibold text-gray-700">{q.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {DAY_CONFIG.map((dayInfo, dayIndex) => {
                const hasData = displayQuarters.some((q) => q.byDay.find((d) => d.dayIndex === dayIndex))
                if (!hasData) return null

                const maxAvgForDay = Math.max(
                  ...displayQuarters.map((q) => {
                    const d = q.byDay.find((b) => b.dayIndex === dayIndex)
                    return d ? d.average : 0
                  }),
                  1
                )

                return (
                  <tr key={dayInfo.label} className="border-b border-gray-100">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-sm ${dayInfo.tailwind}`} />
                        <span className="font-medium text-gray-700">{dayInfo.label}</span>
                      </div>
                    </td>
                    {displayQuarters.map((q) => {
                      const dayData = q.byDay.find((d) => d.dayIndex === dayIndex)
                      if (!dayData) {
                        return <td key={q.key} className="px-4 py-3 text-center text-gray-300">—</td>
                      }
                      return (
                        <td key={q.key} className="px-4 py-3">
                          <div className="flex flex-col items-center gap-1">
                            <span className="font-semibold text-gray-800">{dayData.average}</span>
                            <div className="w-full max-w-[80px] bg-gray-100 rounded-full h-1.5 overflow-hidden">
                              <div
                                className={`h-full rounded-full ${dayInfo.tailwind}`}
                                style={{ width: `${(dayData.average / maxAvgForDay) * 100}%` }}
                              />
                            </div>
                            <span className="text-xs text-gray-400">{dayData.total} / {dayData.days}d</span>
                          </div>
                        </td>
                      )
                    })}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
