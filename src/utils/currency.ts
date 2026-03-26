/**
 * Formats a number as a currency string.
 * @param {number} amount
 * @param {string} [locale='en-PH']
 * @param {string} [currency='PHP']
 * @returns {string}
 */
export function formatCurrency(amount: number, locale: string = 'en-PH', currency: string = 'PHP'): string {
    return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(amount)
}

/**
 * Formats a number with thousand separators (no currency symbol).
 * @param {number} amount
 * @param {string} [locale='en-PH']
 * @returns {string}
 */
export function formatNumberWithSeparators(amount: number, locale: string = 'en-PH'): string {
    return new Intl.NumberFormat(locale, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(amount)
}

/**
 * Parses a currency string back to a float.
 * @param {string} value
 * @returns {number}
 */
export function parseCurrency(value: string): number {
    return parseFloat(value.replace(/[^0-9.-]+/g, ''))
}
