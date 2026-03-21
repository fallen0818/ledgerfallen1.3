/**
 * Export utilities for reports
 * Supports CSV and PDF (print-based) export
 */

/**
 * Convert transactions data to CSV format
 * @param {Array} transactions - Array of transaction objects
 * @returns {string} CSV formatted string
 */
export function transactionsToCSV(transactions) {
    if (!transactions || transactions.length === 0) {
        return ''
    }

    // Define CSV headers
    const headers = ['Date', 'Description', 'Category', 'Type', 'Amount']

    // Convert each transaction to CSV row
    const rows = transactions.map(tx => {
        return [
            tx.transaction_date || '',
            `"${(tx.description || '').replace(/"/g, '""')}"`, // Escape quotes in CSV
            tx.category_name || '',
            tx.type || '',
            tx.amount || '0'
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
export function exportToCSV(csvContent, filename = 'report') {
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
export function exportSummaryToCSV(summary, filename = 'financial_summary') {
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
export function exportToPDF() {
    window.print()
}

/**
 * Combined export handler
 * @param {Array} transactions - Transaction data
 * @param {Object} summary - Summary data
 * @param {string} format - 'csv' or 'pdf'
 * @param {string} filename - Base filename
 */
export function exportReport(transactions, summary, format = 'csv', filename = 'report') {
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
export function exportTransactionsToCSV(transactions, filename = 'transactions') {
    if (!transactions || transactions.length === 0) {
        console.error('No transactions to export')
        return
    }

    const csvData = transactionsToCSV(transactions)
    exportToCSV(csvData, filename)
}
