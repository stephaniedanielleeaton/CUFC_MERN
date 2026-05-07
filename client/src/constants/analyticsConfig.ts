export interface DayConfig {
  label: string
  tailwind: string
  hex: string
}

export const DAY_CONFIG: DayConfig[] = [
  { label: 'Sun', tailwind: 'bg-amber-400', hex: '#fbbf24' },
  { label: 'Mon', tailwind: 'bg-blue-400', hex: '#60a5fa' },
  { label: 'Tue', tailwind: 'bg-emerald-400', hex: '#34d399' },
  { label: 'Wed', tailwind: 'bg-violet-400', hex: '#a78bfa' },
  { label: 'Thu', tailwind: 'bg-rose-400', hex: '#fb7185' },
  { label: 'Fri', tailwind: 'bg-teal-400', hex: '#2dd4bf' },
  { label: 'Sat', tailwind: 'bg-orange-400', hex: '#fb923c' },
]

export type PresetDays = number | 'year' | 'all'

export interface PresetOption {
  label: string
  days: PresetDays
}

export const DATE_PRESETS: PresetOption[] = [
  { label: 'Last 7 Days', days: 7 },
  { label: 'Last 30 Days', days: 30 },
  { label: 'Last 90 Days', days: 90 },
  { label: 'This Year', days: 'year' },
  { label: 'All Time', days: 'all' },
]
