import { useAttendanceAnalytics } from '../../hooks/useAttendanceAnalytics'
import { DAY_CONFIG } from '../../constants/analyticsConfig'
import { formatShortDate, formatLongDate } from '../../utils/analyticsDateUtils'
import AttendanceChart from '../../components/admin/attendance/AttendanceChart'
import StatsCards from '../../components/admin/attendance/StatsCards'
import DateRangeFilter from '../../components/admin/attendance/DateRangeFilter'
import DayFilter from '../../components/admin/attendance/DayFilter'
import DailyBreakdownTable from '../../components/admin/attendance/DailyBreakdownTable'

const DAY_HEX_COLORS = DAY_CONFIG.map((d) => d.hex)

export default function AdminAnalyticsDailyPage() {
  const {
    loading,
    error,
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
  } = useAttendanceAnalytics()

  if (loading) {
    return <div className="text-center py-12 text-gray-400">Loading attendance data...</div>
  }

  if (error) {
    return <div className="text-center py-12 text-red-500">{error}</div>
  }

  return (
    <div>

      <StatsCards stats={stats} />

      <DateRangeFilter
        startDate={startDate}
        endDate={endDate}
        onStartDateChange={setStartDate}
        onEndDateChange={setEndDate}
        onApplyPreset={applyPreset}
        isPresetActive={isPresetActive}
      />

      <DayFilter selectedDay={selectedDay} onSelectDay={setSelectedDay} />

      {filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          No attendance data for the selected days.
        </div>
      ) : (
        <>
          <div className="mb-8">
            <div className="text-sm font-semibold text-gray-700 mb-3">
              Check-ins Over Time ({filtered.length} days, {stats.totalCheckIns} total)
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <AttendanceChart
                data={filtered}
                dayColors={DAY_HEX_COLORS}
                formatDate={formatShortDate}
                formatFullDate={formatLongDate}
              />
            </div>
            <div className="flex flex-wrap gap-4 mt-3 text-xs text-gray-500">
              {DAY_CONFIG.map((dayInfo) => (
                <div key={dayInfo.label} className="flex items-center gap-1.5">
                  <div className={`w-3 h-3 rounded-sm ${dayInfo.tailwind}`} />
                  <span>{dayInfo.label}</span>
                </div>
              ))}
            </div>
          </div>

          <DailyBreakdownTable data={filtered} maxCount={maxCount} />
        </>
      )}
    </div>
  )
}
