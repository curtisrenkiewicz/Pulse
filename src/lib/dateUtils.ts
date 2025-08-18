import { formatInTimeZone } from 'date-fns-tz'

/**
 * Get a date string in the user's timezone in YYYY-MM-DD format
 */
export function getUserDateString(date: Date, timezone: string): string {
  return formatInTimeZone(date, timezone, 'yyyy-MM-dd')
}

/**
 * Get "today" in the user's timezone
 */
export function getTodayInUserTimezone(timezone: string): string {
  return getUserDateString(new Date(), timezone)
}

/**
 * Parse a date string and format it for display
 */
export function formatDateForDisplay(dateString: string, timezone: string, format: string = 'MMM d'): string {
  // Create a date at noon in the user's timezone to avoid date shift issues
  const [year, month, day] = dateString.split('-').map(Number)
  const date = new Date(year, month - 1, day, 12, 0, 0)
  return formatInTimeZone(date, timezone, format)
}