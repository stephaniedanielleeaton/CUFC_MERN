export function getOrdinal(day: number): string {
  if (day === 1 || day === 21 || day === 31) return 'st';
  if (day === 2 || day === 22) return 'nd';
  if (day === 3 || day === 23) return 'rd';
  return 'th';
}

export function formatDate(dateStr: string): string {
  const date = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(date.getTime())) return '';
  const weekday = date.toLocaleDateString('en-US', { weekday: 'long' });
  const month = date.toLocaleDateString('en-US', { month: 'long' });
  const day = date.getDate();
  const year = date.getFullYear();
  return `${weekday}, ${month} ${day}${getOrdinal(day)}, ${year}`;
}

export function formatDateRange(startDate: string, endDate: string): string {
  if (!endDate || startDate === endDate) {
    return formatDate(startDate);
  }
  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return formatDate(startDate);
  }

  const startMonth = start.toLocaleDateString('en-US', { month: 'long' });
  const endMonth = end.toLocaleDateString('en-US', { month: 'long' });
  const startDay = start.getDate();
  const endDay = end.getDate();
  const startYear = start.getFullYear();
  const endYear = end.getFullYear();

  if (startYear !== endYear) {
    return `${startMonth} ${startDay}${getOrdinal(startDay)}, ${startYear} through ${endMonth} ${endDay}${getOrdinal(endDay)}, ${endYear}`;
  }
  if (startMonth !== endMonth) {
    return `${startMonth} ${startDay}${getOrdinal(startDay)} through ${endMonth} ${endDay}${getOrdinal(endDay)}, ${startYear}`;
  }
  return `${startMonth} ${startDay}${getOrdinal(startDay)} through ${endDay}${getOrdinal(endDay)}, ${startYear}`;
}

export function formatDateParts(dateStr: string) {
  const date = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    return { month: '', day: 0, ordinal: '', year: '' };
  }
  const month = date.toLocaleDateString('en-US', { month: 'short' });
  const day = date.getDate();
  const year = date.getFullYear().toString();
  const ordinal = getOrdinal(day);
  return { month, day, ordinal, year };
}

export function formatCutoffDate(dateStr: string): string {
  const date = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function formatEventDateHeader(dateStr: string): string {
  const date = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

export function formatEventTime(timeStr: string): string {
  return timeStr ? timeStr.split(':').slice(0, 2).join(':') : '';
}
