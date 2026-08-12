/**
 * Formats a date value to a readable string.
 * @param {string | Date} date
 * @param {string} [locale='en-US']
 * @returns {string}
 */
export function formatDate(date: string | Date, locale: string = 'en-US'): string {
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(date))
}

/**
 * Gets the current month in YYYY-MM format.
 * @returns {string}
 */
export function getCurrentMonth(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  return `${year}-${month}`
}

/**
 * Convert month format from YYYY-MM to MMM format
 * @param month - 'YYYY-MM' format
 * @returns 'MMM' format (e.g., 'Jan', 'Feb', etc.)
 */
export function convertToDatabaseMonth(month: string): string {
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const monthIndex = parseInt(month.split('-')[1]) - 1
  return monthNames[monthIndex]
}

/**
 * Convert month format from MMM to YYYY-MM format
 * @param month - 'MMM' format (e.g., 'Jan', 'Feb', etc.)
 * @returns 'YYYY-MM' format
 */
export function convertFromDatabaseMonth(month: string, year: number = new Date().getFullYear()): string {
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const monthIndex = monthNames.indexOf(month)
  if (monthIndex === -1) return getCurrentMonth()
  return `${year}-${String(monthIndex + 1).padStart(2, '0')}`
}

/**
 * Gets an array of months for a given year in YYYY-MM format.
 * @param {number} [year] - defaults to the current year
 * @returns {string[]}
 */
export function getYearRange(year?: number): string[] {
  const targetYear = year ?? new Date().getFullYear()
  const months = []
  for (let i = 0; i < 12; i++) {
    const month = String(i + 1).padStart(2, '0')
    months.push(`${targetYear}-${month}`)
  }
  return months
}

/**
 * Gets an array of years for the year selector — includes future years so
 * budgets can be planned ahead of time, not just for past/current data.
 * @param {number} [startYear] - Starting year, defaults to 5 years ago
 * @param {number} [endYear] - Ending year, defaults to 5 years from now
 * @returns {number[]}
 */
export function getYearsRange(startYear?: number, endYear?: number): number[] {
  const currentYear = new Date().getFullYear()
  const start = startYear ?? currentYear - 5
  const end = endYear ?? currentYear + 5

  const years = []
  for (let year = start; year <= end; year++) {
    years.push(year)
  }
  return years.reverse() // Show newest years first
}

/**
 * Returns the ISO start and end dates for a given 'YYYY-MM' month string.
 * @param {string} month — 'YYYY-MM'
 * @returns {{ start: string, end: string }}
 */
export function getMonthRange(month: string): { start: string; end: string } {
  const [year, mon] = month.split('-').map(Number)

  const start = new Date(year, mon - 1, 1)
  const end = new Date(year, mon, 0)

  // Use local date strings instead of ISO strings to avoid timezone issues
  const pad = (n: number) => n.toString().padStart(2, '0')
  const startLocal = `${start.getFullYear()}-${pad(start.getMonth() + 1)}-${pad(start.getDate())}`
  const endLocal = `${end.getFullYear()}-${pad(end.getMonth() + 1)}-${pad(end.getDate())}`

  return {
    start: startLocal,
    end: endLocal,
  }
}
