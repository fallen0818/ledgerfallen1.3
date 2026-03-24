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
 * Gets an array of months for the current year in YYYY-MM format.
 * @returns {string[]}
 */
export function getYearRange(): string[] {
  const currentYear = new Date().getFullYear()
  const months = []
  for (let i = 0; i < 12; i++) {
    const month = String(i + 1).padStart(2, '0')
    months.push(`${currentYear}-${month}`)
  }
  return months
}

/**
 * Returns the ISO start and end dates for a given 'YYYY-MM' month string.
 * @param {string} month — 'YYYY-MM'
 * @returns {{ start: string, end: string }}
 */
export function getMonthRange(month: string): { start: string; end: string } {
  const [year, mon] = month.split('-').map(Number)
  console.log('getMonthRange input:', { month, year, mon })

  const start = new Date(year, mon - 1, 1)
  const end = new Date(year, mon, 0)

  // Use local date strings instead of ISO strings to avoid timezone issues
  const pad = (n: number) => n.toString().padStart(2, '0')
  const startLocal = `${start.getFullYear()}-${pad(start.getMonth() + 1)}-${pad(start.getDate())}`
  const endLocal = `${end.getFullYear()}-${pad(end.getMonth() + 1)}-${pad(end.getDate())}`

  const result = {
    start: startLocal,
    end: endLocal,
  }

  console.log('getMonthRange output:', result)

  // Log the actual dates for debugging
  const startStr = start.toString()
  const endStr = end.toString()
  const startISO = start.toISOString()
  const endISO = end.toISOString()
  const startFormatted = start.toISOString().split('T')[0]
  const endFormatted = end.toISOString().split('T')[0]

  console.log('Date objects:')
  console.log('  start:', startStr)
  console.log('  end:', endStr)
  console.log('  startISO:', startISO)
  console.log('  endISO:', endISO)
  console.log('  startFormatted:', startFormatted)
  console.log('  endFormatted:', endFormatted)

  return result
}
