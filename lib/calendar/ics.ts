export const DAY_OFFSET: Record<string, number> = {
  Monday: 0,
  Tuesday: 1,
  Wednesday: 2,
  Thursday: 3,
  Friday: 4,
  Saturday: 5,
  Sunday: 6,
}

function pad(value: number): string {
  return String(value).padStart(2, '0')
}

export function addDaysToDateString(dateString: string, offsetDays: number): string {
  const [year, month, day] = dateString.split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1, day + offsetDays))
  return [
    date.getUTCFullYear(),
    pad(date.getUTCMonth() + 1),
    pad(date.getUTCDate()),
  ].join('-')
}

export function icalFloatingDateTime(dateString: string, hour: number, minute: number): string {
  const [year, month, day] = dateString.split('-').map(Number)
  return `${year}${pad(month)}${pad(day)}T${pad(hour)}${pad(minute)}00`
}

export function escIcalText(str: string): string {
  return str.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n')
}
