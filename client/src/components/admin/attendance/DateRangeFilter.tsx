import { DATE_PRESETS, PresetDays } from '../../../constants/analyticsConfig'

interface DateRangeFilterProps {
  startDate: string
  endDate: string
  onStartDateChange: (value: string) => void
  onEndDateChange: (value: string) => void
  onApplyPreset: (days: PresetDays) => void
  isPresetActive: (days: PresetDays) => boolean
}

export default function DateRangeFilter({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  onApplyPreset,
  isPresetActive,
}: Readonly<DateRangeFilterProps>) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
      <div className="text-sm font-semibold text-gray-700 mb-3">Date Range</div>
      <div className="flex flex-wrap gap-2 mb-3">
        {DATE_PRESETS.map((preset) => {
          const active = isPresetActive(preset.days)
          return (
            <button
              key={preset.label}
              onClick={() => onApplyPreset(preset.days)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                active
                  ? 'bg-medium-pink text-white border-medium-pink'
                  : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
              }`}
            >
              {preset.label}
            </button>
          )
        })}
      </div>
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label htmlFor="startDate" className="block text-xs text-gray-500 mb-1">From</label>
          <input
            id="startDate"
            type="date"
            value={startDate}
            onChange={(e) => onStartDateChange(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-medium-pink"
          />
        </div>
        <div>
          <label htmlFor="endDate" className="block text-xs text-gray-500 mb-1">To</label>
          <input
            id="endDate"
            type="date"
            value={endDate}
            onChange={(e) => onEndDateChange(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-medium-pink"
          />
        </div>
      </div>
    </div>
  )
}
