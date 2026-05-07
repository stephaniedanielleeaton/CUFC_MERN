import type { AttendanceStats } from '../../../hooks/useAttendanceAnalytics'

interface StatsCardsProps {
  stats: AttendanceStats
}

export default function StatsCards({ stats }: Readonly<StatsCardsProps>) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
      <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
        <div className="text-3xl font-bold text-medium-pink">{stats.average}</div>
        <div className="text-xs text-medium-gray uppercase tracking-wide mt-1">Avg Check-ins / Day</div>
      </div>
      <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
        <div className="text-3xl font-bold text-medium-pink">{stats.totalCheckIns}</div>
        <div className="text-xs text-medium-gray uppercase tracking-wide mt-1">Total Check-ins</div>
      </div>
      <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
        <div className="text-3xl font-bold text-medium-pink">{stats.peak ?? '—'}</div>
        <div className="text-xs text-medium-gray uppercase tracking-wide mt-1">Peak Day</div>
      </div>
    </div>
  )
}
