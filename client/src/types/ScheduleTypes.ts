export interface ScheduleItem {
  _id?: string
  discipline: string
  day: string
  time: string
  subtitle?: string
}

export interface Event {
  _id?: string
  title: string
  date: string
  description?: string
}

export interface Closure {
  _id?: string
  reason: string
  date: string
  dates?: string
}

export interface ScheduleData {
  scheduleItems: ScheduleItem[]
  upcomingEvents: Event[]
  upcomingClosures: Closure[]
}
