import { DAY_CONFIG } from '../../../constants/analyticsConfig'

interface DayFilterProps {
  selectedDay: 'all' | number
  onSelectDay: (day: 'all' | number) => void
}

export default function DayFilter({ selectedDay, onSelectDay }: Readonly<DayFilterProps>) {
  return (
    <div className="mb-6">
      <div className="text-sm font-semibold text-gray-700 mb-2">Filter by Day of Week</div>
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => onSelectDay('all')}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
            selectedDay === 'all'
              ? 'bg-medium-pink text-white border-medium-pink'
              : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
          }`}
        >
          All
        </button>
        {DAY_CONFIG.map((dayInfo, index) => {
          const isSelected = selectedDay === index
          return (
            <button
              key={dayInfo.label}
              onClick={() => onSelectDay(index)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                isSelected
                  ? 'bg-medium-pink text-white border-medium-pink'
                  : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
              }`}
            >
              {dayInfo.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
