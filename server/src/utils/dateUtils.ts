import { DateTime } from 'luxon';
import { APP_TIMEZONE } from '../config/appTime';

export function getTodayMidnight(): Date {
  return DateTime.now().setZone(APP_TIMEZONE).startOf('day').toUTC().toJSDate();
}

export function getDateMonthsAgo(months: number): Date {
  return DateTime.now().setZone(APP_TIMEZONE).minus({ months }).toUTC().toJSDate();
}
