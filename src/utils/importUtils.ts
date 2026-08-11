/**
 * Import utilities for transactions
 * Supports CSV file import
 */

interface TransactionImport {
    amount?: number | string
    description?: string
    transaction_date?: string
    category_name?: string
    type?: string
    user_email?: string
    [key: string]: any
}

interface CSVValidationResult {
    valid: TransactionImport[]
    invalid: Array<TransactionImport & { rowIndex: number; errors: string[] }>
    errors: string[]
    totalValid: number
    totalInvalid: number
    totalRows: number
}

/**
 * Parse CSV content into array of objects
 * @param {string} csvContent - Raw CSV string
 * @returns {Array} Array of transaction objects
 */
export function parseCSV(csvContent: string): TransactionImport[] {
    if (!csvContent || typeof csvContent !== 'string') {
        throw new Error('Invalid CSV content')
    }

    const lines = csvContent.trim().split('\n')
    if (lines.length < 2) {
        throw new Error('CSV file must have at least a header row and one data row')
    }

    // Parse header row
    const headers = parseCSVLine(lines[0])

    // Normalize headers to match our schema
    const normalizedHeaders = normalizeHeaders(headers)

    // Parse data rows
    const transactions: TransactionImport[] = []
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim()
        if (!line) continue

        const values = parseCSVLine(line)
        const transaction: TransactionImport = {}

        normalizedHeaders.forEach((header: string | null, index: number) => {
            if (header && values[index] !== undefined) {
                transaction[header] = values[index]
            }
        })

        // Apply transformations
        if (transaction.amount) {
            transaction.amount = parseFloat(transaction.amount.toString().replace(/[^0-9.-]/g, ''))
        }

        if (transaction.transaction_date) {
            transaction.transaction_date = normalizeDate(transaction.transaction_date)
        }

        // Only add if has required fields
        if (transaction.amount && transaction.transaction_date) {
            transactions.push(transaction)
        }
    }

    return transactions
}

/**
 * Parse a single CSV line handling quoted values
 * @param {string} line - CSV line
 * @returns {Array} Array of values
 */
function parseCSVLine(line: string): string[] {
    const values: string[] = []
    let current = ''
    let inQuotes = false

    for (let i = 0; i < line.length; i++) {
        const char = line[i]
        const nextChar = line[i + 1]

        if (char === '"' && inQuotes && nextChar === '"') {
            // Escaped quote
            current += '"'
            i++
        } else if (char === '"') {
            inQuotes = !inQuotes
        } else if (char === ',' && !inQuotes) {
            values.push(current.trim())
            current = ''
        } else {
            current += char
        }
    }

    // Add last value
    values.push(current.trim())
    return values
}

/**
 * Normalize CSV headers to match transaction schema
 * @param {Array} headers - Original headers
 * @returns {Array} Normalized headers
 */
function normalizeHeaders(headers: string[]): (string | null)[] {
    const mapping: Record<string, string> = {
        'date': 'transaction_date',
        'transaction_date': 'transaction_date',
        'created_at': 'transaction_date',
        'description': 'description',
        'desc': 'description',
        'note': 'description',
        'category': 'category_name',
        'category_name': 'category_name',
        'type': 'type',
        'transaction_type': 'type',
        'amount': 'amount',
        'value': 'amount',
        'email': 'user_email',
        'user_email': 'user_email',
        'user': 'user_email'
    }

    return headers.map((h: string) => {
        const normalized = h.toLowerCase().replace(/[^a-z0-9_]/g, '').trim()
        return mapping[normalized] || null
    })
}

/**
 * Normalize date string to YYYY-MM-DD format
 * @param {string} dateStr - Date string in various formats
 * @returns {string} Normalized date in YYYY-MM-DD format
 */
function normalizeDate(dateStr: string): string {
    if (!dateStr) return ''

    // Try to parse the date
    const date = new Date(dateStr)
    if (isNaN(date.getTime())) {
        // Try common formats
        const formats = [
            /(\d{1,2})\/(\d{1,2})\/(\d{4})/, // MM/DD/YYYY or DD/MM/YYYY
            /(\d{1,2})-(\d{1,2})-(\d{4})/, // MM-DD-YYYY or DD-MM-YYYY
            /(\d{4})\/(\d{1,2})\/(\d{1,2})/, // YYYY/MM/DD
        ]

        for (const format of formats) {
            const match = dateStr.match(format)
            if (match) {
                // Assume MM/DD/YYYY format
                const [, m, d, y] = match
                return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`
            }
        }
        return ''
    }

    return date.toISOString().split('T')[0]
}

/**
 * Validate imported transactions
 * @param {Array} transactions - Array of transaction objects
 * @param {Object} options - Validation options
 * @returns {Object} Validation result with valid and invalid arrays
 */
export function validateImport(transactions: TransactionImport[], options: { requiredFields?: string[]; maxTransactions?: number } = {}): CSVValidationResult {
    const { requiredFields = ['amount', 'transaction_date'], maxTransactions = 1000 } = options

    const valid: TransactionImport[] = []
    const invalid: Array<TransactionImport & { rowIndex: number; errors: string[] }> = []
    const errors: string[] = []

    if (transactions.length > maxTransactions) {
        errors.push(`Too many transactions. Maximum allowed: ${maxTransactions}`)
    }

    transactions.forEach((tx: TransactionImport, index: number) => {
        const rowErrors: string[] = []

        // Check required fields
        requiredFields.forEach((field: string) => {
            if (!tx[field]) {
                rowErrors.push(`Missing ${field}`)
            }
        })

        // Validate amount
        if (tx.amount !== undefined && (isNaN(Number(tx.amount)) || Number(tx.amount) < 0)) {
            rowErrors.push('Invalid amount')
        }

        // Validate date
        if (tx.transaction_date && !/^\d{4}-\d{2}-\d{2}$/.test(tx.transaction_date)) {
            rowErrors.push('Invalid date format')
        }

        // Note: no longer restricting to a fixed whitelist of type values —
        // this app supports arbitrary custom types (see typeService.createType),
        // and Assets/Equities/Liabilities are legitimate real types that were
        // being incorrectly rejected here before.

        if (rowErrors.length > 0) {
            invalid.push({ ...tx, rowIndex: index + 2, errors: rowErrors })
        } else {
            valid.push({ ...tx, rowIndex: index + 2 })
        }
    })

    return {
        valid,
        invalid,
        errors,
        totalValid: valid.length,
        totalInvalid: invalid.length,
        totalRows: transactions.length
    }
}

/**
 * Read file as text
 * @param {File} file - File object from input
 * @returns {Promise<string>} File content
 */
export function readFileAsText(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = (e: ProgressEvent<FileReader>) => resolve(e.target?.result as string)
        reader.onerror = () => reject(new Error('Failed to read file'))
        reader.readAsText(file)
    })
}

/**
 * Import transactions from a file
 * @param {File} file - File object from input
 * @param {Object} options - Import options
 * @returns {Promise<Object>} Import result
 */
export async function importFromFile(file: File, options: { requiredFields?: string[]; maxTransactions?: number } = {}): Promise<{ success: boolean; transactions?: TransactionImport[]; validation?: CSVValidationResult; rawData?: TransactionImport[]; error?: string }> {
    try {
        // Check file type
        const validTypes = ['.csv', 'text/csv', 'application/vnd.ms-excel']
        if (!validTypes.includes(file.type) && !file.name.endsWith('.csv')) {
            throw new Error('Please upload a CSV file')
        }

        // Read file content
        const content = await readFileAsText(file)

        // Parse CSV
        const transactions = parseCSV(content)

        if (transactions.length === 0) {
            throw new Error('No valid transactions found in the file')
        }

        // Validate transactions
        const validation = validateImport(transactions, options)

        return {
            success: true,
            transactions: validation.valid,
            validation,
            rawData: transactions
        }
    } catch (error: unknown) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        }
    }
}

/**
 * Generate sample CSV template
 * @returns {string} CSV template content
 */
export function generateCSVTemplate() {
    const headers = ['Date', 'Description', 'Category', 'Type', 'Amount']
    const sampleRows = [
        [new Date().toISOString().split('T')[0], 'Sample income', 'Salary', 'income', '5000.00'],
        [new Date().toISOString().split('T')[0], 'Sample expense', 'Food', 'expense', '50.00']
    ]

    const rows = sampleRows.map(row => row.join(','))
    return [headers.join(','), ...rows].join('\n')
}

/**
 * Download CSV template
 * @param {string} filename - Name of the template file
 */
export function downloadCSVTemplate(filename = 'transactions_template.csv') {
    const csv = generateCSVTemplate()
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })

    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)

    link.setAttribute('href', url)
    link.setAttribute('download', filename)
    link.style.visibility = 'hidden'

    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    if (typeof URL !== 'undefined' && URL.revokeObjectURL) {
        URL.revokeObjectURL(url)
    }
}
