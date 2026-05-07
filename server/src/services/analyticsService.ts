import { DateTime } from 'luxon';
import { APP_TIMEZONE } from '../config/appTime';
import { attendanceDAO, DailyCheckInCount } from '../dao/attendanceDAO';

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

async function getDailySummary(
  startDate?: Date,
  endDate?: Date
): Promise<DailyAttendanceSummary[]> {
  const rawCounts: DailyCheckInCount[] = await attendanceDAO.getDailyCheckInCounts(
    APP_TIMEZONE,
    startDate,
    endDate
  )

  return rawCounts
    .map((record) => {
      const dt = DateTime.fromFormat(record.date, 'yyyy-MM-dd', { zone: APP_TIMEZONE })
      if (!dt.isValid) {
        console.error(`Invalid date format: ${record.date}`)
        return null
      }
      return {
        date: record.date,
        count: record.count,
        dayOfWeek: dt.weekday % 7,
        dayName: dt.toFormat('cccc'),
      }
    })
    .filter((item): item is DailyAttendanceSummary => item !== null)
}

async function getQuarterlySummary(): Promise<QuarterData[]> {
  const rawCounts: DailyCheckInCount[] = await attendanceDAO.getDailyCheckInCounts(APP_TIMEZONE)

  const grouped: Record<string, { total: number; days: number; byDay: Record<number, { total: number; days: number }> }> = {}
  const order: string[] = []

  rawCounts.forEach((record) => {
    const dt = DateTime.fromFormat(record.date, 'yyyy-MM-dd', { zone: APP_TIMEZONE })
    if (!dt.isValid) {
      console.error(`Invalid date format: ${record.date}`)
      return
    }
    const year = dt.year
    const quarter = Math.ceil(dt.month / 3)
    const key = `${year}-${quarter}`

    if (!grouped[key]) {
      grouped[key] = { total: 0, days: 0, byDay: {} }
      order.push(key)
    }

    grouped[key].total += record.count
    grouped[key].days += 1

    const dayOfWeek = dt.weekday % 7
    if (!grouped[key].byDay[dayOfWeek]) {
      grouped[key].byDay[dayOfWeek] = { total: 0, days: 0 }
    }
    grouped[key].byDay[dayOfWeek].total += record.count
    grouped[key].byDay[dayOfWeek].days += 1
  })

  return order.map((key, index) => {
    const [yearStr, quarterStr] = key.split('-')
    const info = grouped[key]
    const average = info.days > 0 ? Math.round((info.total / info.days) * 10) / 10 : 0
    const prev = index > 0 ? grouped[order[index - 1]] : null
    const prevAvg = prev && prev.days > 0 ? prev.total / prev.days : null

    const change = prevAvg !== null && prevAvg > 0
      ? Math.round(((average - prevAvg) / prevAvg) * 100)
      : null

    const byDay: QuarterDayData[] = [0, 1, 2, 3, 4, 5, 6].map((dayIndex) => {
      const dayData = info.byDay[dayIndex]
      const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

      return {
        dayIndex,
        dayLabel: dayLabels[dayIndex],
        total: dayData ? dayData.total : 0,
        days: dayData ? dayData.days : 0,
        average: dayData && dayData.days > 0 ? Math.round((dayData.total / dayData.days) * 10) / 10 : 0,
      }
    }).filter((d) => d.days > 0)

    return {
      key,
      label: `Q${quarterStr} ${yearStr}`,
      total: info.total,
      days: info.days,
      average,
      change,
      byDay,
    }
  })
}

export const analyticsService = {
  getDailySummary,
  getQuarterlySummary,
};
