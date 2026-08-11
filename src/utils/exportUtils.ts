/**
 * Export utilities for reports
 * Supports CSV and PDF (print-based) export
 */

import { isExpenseType } from './transactionTypes'

interface Transaction {
    transaction_date?: string
    description?: string
    category_name?: string
    type?: string
    amount?: string
}

interface Summary {
    revenue: number
    expenses: number
    net: number
    startDate?: string
    endDate?: string
}

/**
 * Convert transactions data to CSV format
 * @param {Array} transactions - Array of transaction objects
 * @returns {string} CSV formatted string
 */
export function transactionsToCSV(transactions: Transaction[]): string {
    if (!transactions || transactions.length === 0) {
        return ''
    }

    // Define CSV headers
    const headers = ['Date', 'Description', 'Category', 'Type', 'Amount']

    // Helper function to properly escape CSV fields
    const escapeCSVField = (value: string): string => {
        if (!value) return ''
        const stringValue = String(value)
        // If the field contains commas, quotes, or newlines, wrap it in quotes and escape internal quotes
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n') || stringValue.includes('\r')) {
            return `"${stringValue.replace(/"/g, '""')}"`
        }
        return stringValue
    }

    // Convert each transaction to CSV row
    const rows = transactions.map(tx => {
        return [
            escapeCSVField(tx.transaction_date || ''),
            escapeCSVField(tx.description || ''),
            escapeCSVField(tx.category_name || ''),
            escapeCSVField(tx.type || ''),
            escapeCSVField(tx.amount || '0')
        ].join(',')
    })

    // Combine headers and rows
    return [headers.join(','), ...rows].join('\n')
}

/**
 * Export data to CSV file
 * @param {string} csvContent - CSV formatted string
 * @param {string} filename - Name of the file (without extension)
 */
export function exportToCSV(csvContent: string, filename: string = 'report'): void {
    if (!csvContent) {
        console.error('No data to export')
        return
    }

    // Create Blob from CSV content
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().split('T')[0]
    const fullFilename = `${filename}_${timestamp}.csv`

    // Create download link
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)

    link.setAttribute('href', url)
    link.setAttribute('download', fullFilename)
    link.style.visibility = 'hidden'

    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    // Clean up the URL
    URL.revokeObjectURL(url)
}

/**
 * Export summary data to CSV
 * @param {Object} summary - Summary object with revenue, expenses, net
 * @param {string} filename - Name of the file (without extension)
 */
export function exportSummaryToCSV(summary: Summary, filename: string = 'financial_summary'): void {
    const { revenue, expenses, net, startDate, endDate } = summary

    const csvContent = [
        'Financial Summary Report',
        `Generated: ${new Date().toLocaleDateString()}`,
        `Period: ${startDate || 'All time'} to ${endDate || 'Present'}`,
        '',
        'Metric,Amount',
        `Total Revenue,${revenue}`,
        `Total Expenses,${expenses}`,
        `Net ${net >= 0 ? 'Income' : 'Loss'},${net}`
    ].join('\n')

    exportToCSV(csvContent, filename)
}

/**
 * Open print dialog for PDF export
 * Uses browser's print functionality with print-specific CSS
 */
export function exportToPDF(): void {
    window.print()
}

/**
 * Combined export handler
 * @param {Array} transactions - Transaction data
 * @param {Object} summary - Summary data
 * @param {string} format - 'csv' or 'pdf'
 * @param {string} filename - Base filename
 */
export function exportReport(transactions: Transaction[], summary: Summary, format: string = 'csv', filename: string = 'report'): void {
    if (format.toLowerCase() === 'csv') {
        // Export detailed transactions
        const csvData = transactionsToCSV(transactions)
        exportToCSV(csvData, filename)

        // Also export summary
        exportSummaryToCSV(summary, `${filename}_summary`)
    } else if (format.toLowerCase() === 'pdf') {
        exportToPDF()
    } else {
        console.error(`Unsupported export format: ${format}`)
    }
}

/**
 * Export transactions directly from a list
 * @param {Array} transactions - Array of transaction objects
 * @param {string} filename - Name of the file (without extension)
 */
export function exportTransactionsToCSV(transactions: Transaction[], filename: string = 'transactions'): void {
    if (!transactions || transactions.length === 0) {
        console.error('No transactions to export')
        return
    }

    const csvData = transactionsToCSV(transactions)
    exportToCSV(csvData, filename)
}

/**
 * Export variance report data to CSV
 * @param {Array} transactions - Array of transaction objects
 * @param {Array} budgets - Array of budget objects
 * @param {string} filename - Name of the file (without extension)
 */
export function exportVarianceReportToCSV(transactions: Transaction[], budgets: Array<{ category: string; amount: number }>, filename: string = 'variance_report'): void {
    if (!transactions || transactions.length === 0) {
        console.error('No transactions to export')
        return
    }

    // Helper function to properly escape CSV fields
    const escapeCSVField = (value: string): string => {
        if (!value) return ''
        const stringValue = String(value)
        // If the field contains commas, quotes, or newlines, wrap it in quotes and escape internal quotes
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n') || stringValue.includes('\r')) {
            return `"${stringValue.replace(/"/g, '""')}"`
        }
        return stringValue
    }

    // Group only expenses by category (ignore income/revenue for the variance report)
    const isExpense = (t: Transaction) => isExpenseType(t.type)
    const spentByCategory: Record<string, number> = transactions
        .filter(isExpense)
        .reduce((acc, t) => {
            acc[t.category_name || 'Uncategorized'] = (acc[t.category_name || 'Uncategorized'] ?? 0) + Number(t.amount || 0)
            return acc
        }, {} as Record<string, number>)

    // 'Total' is the overall monthly budget limit, not a real spending
    // category — exclude it so it doesn't show up as a fake row in export.
    const realBudgets = budgets.filter((b) => b.category !== 'Total')

    // Collect all categories (from both budgets and expenses)
    const allCategories = [
        ...new Set([
            ...realBudgets.map((b) => b.category),
            ...Object.keys(spentByCategory),
        ]),
    ].sort()

    if (allCategories.length === 0) {
        console.error('No categories found for variance report')
        return
    }

    // Define CSV headers
    const headers = ['Category', 'Budgeted', 'Actual', 'Variance', 'Status']

    // Convert each category to CSV row
    const rows = allCategories.map((cat) => {
        const budgeted = Number(realBudgets.find((b) => b.category === cat)?.amount ?? 0)
        const actual = spentByCategory[cat] || 0
        const variance = budgeted - actual
        const isOver = variance < 0
        const isUnder = variance > 0
        const status = isOver ? 'Over' : isUnder ? 'Under' : 'On Track'

        return [
            escapeCSVField(cat),
            escapeCSVField(budgeted.toString()),
            escapeCSVField(actual.toString()),
            escapeCSVField(Math.abs(variance).toString()),
            escapeCSVField(status)
        ].join(',')
    })

    // Combine headers and rows
    const csvContent = [headers.join(','), ...rows].join('\n')

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().split('T')[0]
    const fullFilename = `${filename}_${timestamp}.csv`

    // Create Blob from CSV content
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })

    // Create download link
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)

    link.setAttribute('href', url)
    link.setAttribute('download', fullFilename)
    link.style.visibility = 'hidden'

    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    // Clean up the URL
    URL.revokeObjectURL(url)
}
