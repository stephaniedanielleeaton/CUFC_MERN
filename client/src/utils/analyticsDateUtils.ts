export const APP_TIMEZONE = 'America/New_York'

export function toInputDate(d: Date): string {
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function formatShortDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number)
  const utcDate = new Date(Date.UTC(year, month - 1, day, 12, 0, 0))
  return utcDate.toLocaleDateString('en-US', {
    timeZone: APP_TIMEZONE,
    month: 'short',
    day: 'numeric',
  })
}

export function formatLongDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number)
  const utcDate = new Date(Date.UTC(year, month - 1, day, 12, 0, 0))
  return utcDate.toLocaleDateString('en-US', {
    timeZone: APP_TIMEZONE,
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}
