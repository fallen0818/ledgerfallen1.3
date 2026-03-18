/**
 * Formats a date value to a readable string.
 * @param {string | Date} date
 * @param {string} [locale='en-US']
 * @returns {string}
 */
export function formatDate(date, locale = 'en-US') {
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(date))
}

/**
 * Returns the current month as a 'YYYY-MM' string.
 * @returns {string}
 */
export function getCurrentMonth() {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  return `${y}-${m}`
}

/**
 * Returns the ISO start and end dates for a given 'YYYY-MM' month string.
 * @param {string} month — 'YYYY-MM'
 * @returns {{ start: string, end: string }}
 */
export function getMonthRange(month) {
  const [year, mon] = month.split('-').map(Number)
  const start = new Date(year, mon - 1, 1)
  const end = new Date(year, mon, 0)
  return {
    start: start.toISOString().split('T')[0],
    end: end.toISOString().split('T')[0],
  }
}
