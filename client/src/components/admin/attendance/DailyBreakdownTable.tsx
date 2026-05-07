import { useMemo } from 'react'
import type { DailyAttendanceSummary } from '../../../services/analyticsService'
import { DAY_CONFIG } from '../../../constants/analyticsConfig'
import { formatLongDate } from '../../../utils/analyticsDateUtils'

interface DailyBreakdownTableProps {
  data: DailyAttendanceSummary[]
  maxCount: number
}

export default function DailyBreakdownTable({ data, maxCount }: Readonly<DailyBreakdownTableProps>) {
  const reversed = useMemo(() => [...data].reverse(), [data])

  return (
    <div>
      <div className="text-sm font-semibold text-gray-700 mb-3">Daily Breakdown</div>
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 font-semibold text-gray-700">Date</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">Day</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-700">Check-ins</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700 w-full">Bar</th>
              </tr>
            </thead>
            <tbody>
              {reversed.map((day) => (
                <tr key={day.date} className="border-b border-gray-100 hover:bg-gray-50/50">
                  <td className="px-4 py-2.5 text-gray-800 whitespace-nowrap">
                    {formatLongDate(day.date)}
                  </td>
                  <td className="px-4 py-2.5 text-gray-600 whitespace-nowrap">{day.dayName}</td>
                  <td className="px-4 py-2.5 text-right font-semibold text-gray-800 whitespace-nowrap">
                    {day.count}
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${DAY_CONFIG[day.dayOfWeek].tailwind}`}
                        style={{
                          width: `${Math.max((day.count / maxCount) * 100, 2)}%`,
                        }}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
