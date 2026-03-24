import React, { useState, useRef } from 'react'
import { Modal } from './Modal'
import { Button } from './Button'
import { useToast } from './Toast'
import { importFromFile, downloadCSVTemplate } from '../../utils/importUtils'
import { formatCurrency } from '../../utils/currency'
import './ImportModal.css'

interface ImportTransaction {
    amount?: number | string
    description?: string
    transaction_date?: string
    category_name?: string
    type?: string
    user_email?: string
    rowIndex: number
    errors?: string[]
}

interface CSVValidationResult {
    valid: ImportTransaction[]
    invalid: Array<ImportTransaction & { rowIndex: number; errors: string[] }>
    errors: string[]
    totalValid: number
    totalInvalid: number
    totalRows: number
}

interface ImportResult {
    success: boolean
    transactions?: ImportTransaction[]
    validation?: CSVValidationResult
    rawData?: ImportTransaction[]
    error?: string
}

interface ImportModalProps {
    isOpen: boolean
    onClose: () => void
    onImport: (transactions: ImportTransaction[]) => Promise<void>
}

export function ImportModal({ isOpen, onClose, onImport }: ImportModalProps) {
    const [step, setStep] = useState('upload') // 'upload' | 'preview' | 'importing' | 'complete'
    const [importData, setImportData] = useState<ImportResult | null>(null)
    const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set())
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const toast = useToast()

    const resetState = () => {
        setStep('upload')
        setImportData(null)
        setSelectedRows(new Set())
        setLoading(false)
        setError(null)
    }

    const handleClose = () => {
        resetState()
        onClose()
    }

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0]
        if (!selectedFile) return

        setLoading(true)
        setError(null)

        const result = await importFromFile(selectedFile)

        if (result.success) {
            // Convert TransactionImport to ImportTransaction with rowIndex
            const convertedResult: ImportResult = {
                success: result.success,
                transactions: result.transactions?.map((tx, index) => ({
                    ...tx,
                    rowIndex: index + 2 // Start from row 2 (after header)
                })),
                validation: result.validation ? {
                    ...result.validation,
                    valid: result.validation.valid.map((tx, index) => ({
                        ...tx,
                        rowIndex: index + 2 // Start from row 2 (after header)
                    })),
                    invalid: result.validation.invalid.map((tx, index) => ({
                        ...tx,
                        rowIndex: index + 2 // Start from row 2 (after header)
                    }))
                } : undefined,
                rawData: result.rawData?.map((tx, index) => ({
                    ...tx,
                    rowIndex: index + 2 // Start from row 2 (after header)
                })),
                error: result.error
            }

            setImportData(convertedResult)
            // Select all valid rows by default
            if (convertedResult.validation) {
                const allValidIndexes = new Set(convertedResult.validation.valid.map(tx => tx.rowIndex))
                setSelectedRows(allValidIndexes)
            }
            setStep('preview')
        } else {
            setError(result.error || 'Failed to process file')
        }

        setLoading(false)
    }

    const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault()
        const droppedFile = e.dataTransfer.files?.[0]
        if (droppedFile) {
            setLoading(true)
            setError(null)

            const result = await importFromFile(droppedFile)

            if (result.success) {
                // Convert TransactionImport to ImportTransaction with rowIndex
                const convertedResult = {
                    ...result,
                    transactions: result.transactions?.map((tx, index) => ({
                        ...tx,
                        rowIndex: index + 2 // Start from row 2 (after header)
                    })),
                    validation: result.validation ? {
                        ...result.validation,
                        valid: result.validation.valid.map((tx, index) => ({
                            ...tx,
                            rowIndex: index + 2 // Start from row 2 (after header)
                        })),
                        invalid: result.validation.invalid.map((tx, index) => ({
                            ...tx,
                            rowIndex: index + 2 // Start from row 2 (after header)
                        }))
                    } : undefined,
                    rawData: result.rawData?.map((tx, index) => ({
                        ...tx,
                        rowIndex: index + 2 // Start from row 2 (after header)
                    }))
                }

                setImportData(convertedResult)
                if (convertedResult.validation) {
                    const allValidIndexes = new Set(convertedResult.validation.valid.map(tx => tx.rowIndex))
                    setSelectedRows(allValidIndexes)
                }
                setStep('preview')
            } else {
                setError(result.error || 'Failed to process file')
            }

            setLoading(false)
        }
    }

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault()
    }

    const toggleRow = (rowIndex: number) => {
        const newSelected = new Set(selectedRows)
        if (newSelected.has(rowIndex)) {
            newSelected.delete(rowIndex)
        } else {
            newSelected.add(rowIndex)
        }
        setSelectedRows(newSelected)
    }

    const toggleAllRows = () => {
        if (importData?.validation && selectedRows.size === importData.validation.valid.length) {
            setSelectedRows(new Set())
        } else if (importData?.validation) {
            const allValidIndexes = new Set(importData.validation.valid.map(tx => tx.rowIndex))
            setSelectedRows(allValidIndexes)
        }
    }

    const handleImport = async () => {
        if (!importData?.validation) return

        const selectedTransactions = importData.validation.valid.filter(
            tx => selectedRows.has(tx.rowIndex)
        )

        if (selectedTransactions.length === 0) {
            toast.warning('Please select at least one transaction to import')
            return
        }

        setStep('importing')
        setLoading(true)

        try {
            await onImport(selectedTransactions)
            setStep('complete')
            toast.success(`Successfully imported ${selectedTransactions.length} transactions!`)
        } catch (err) {
            setError('Failed to import transactions: ' + (err as Error).message)
            setStep('preview')
        }

        setLoading(false)
    }

    const handleDownloadTemplate = () => {
        downloadCSVTemplate()
        toast.info('Template downloaded!')
    }

    const renderUploadStep = () => (
        <div className="import-modal__upload">
            <div
                className={`import-modal__dropzone ${loading ? 'import-modal__dropzone--loading' : ''}`}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onClick={() => fileInputRef.current?.click()}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv"
                    onChange={handleFileSelect}
                    style={{ display: 'none' }}
                />

                {loading ? (
                    <div className="import-modal__spinner">
                        <span className="import-modal__spinner-icon">⏳</span>
                        <p>Processing file...</p>
                    </div>
                ) : (
                    <>
                        <span className="import-modal__dropzone-icon">📁</span>
                        <p className="import-modal__dropzone-text">
                            Drag and drop a CSV file here, or click to browse
                        </p>
                        <p className="import-modal__dropzone-hint">
                            Supported format: .csv
                        </p>
                    </>
                )}
            </div>

            {error && (
                <div className="import-modal__error">
                    <span>⚠️</span> {error}
                </div>
            )}

            <div className="import-modal__template">
                <p>Need help? Download our template:</p>
                <Button variant="ghost" onClick={handleDownloadTemplate}>
                    Download CSV Template
                </Button>
            </div>

            <div className="import-modal__instructions">
                <h4>CSV Format Requirements:</h4>
                <ul>
                    <li>First row must contain headers: Date, Description, Category, Type, Amount</li>
                    <li>Date format: YYYY-MM-DD or MM/DD/YYYY</li>
                    <li>Type must be: income, expense, revenue, or spending</li>
                    <li>Amount should be a positive number</li>
                </ul>
            </div>
        </div>
    )

    const renderPreviewStep = () => {
        if (!importData?.validation) return null
        const { validation } = importData
        const selectedCount = selectedRows.size

        return (
            <div className="import-modal__preview">
                <div className="import-modal__stats">
                    <div className="import-modal__stat import-modal__stat--success">
                        <span className="import-modal__stat-value">{validation.totalValid}</span>
                        <span className="import-modal__stat-label">Valid</span>
                    </div>
                    <div className="import-modal__stat import-modal__stat--warning">
                        <span className="import-modal__stat-value">{validation.totalInvalid}</span>
                        <span className="import-modal__stat-label">Invalid</span>
                    </div>
                    <div className="import-modal__stat">
                        <span className="import-modal__stat-value">{selectedCount}</span>
                        <span className="import-modal__stat-label">Selected</span>
                    </div>
                </div>

                <div className="import-modal__table-wrapper">
                    <table className="import-modal__table">
                        <thead>
                            <tr>
                                <th>
                                    <input
                                        type="checkbox"
                                        checked={selectedRows.size === validation.valid.length}
                                        onChange={toggleAllRows}
                                    />
                                </th>
                                <th>Row</th>
                                <th>Date</th>
                                <th>Description</th>
                                <th>Category</th>
                                <th>Type</th>
                                <th>Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            {validation.valid.map((tx) => (
                                <tr
                                    key={tx.rowIndex}
                                    className={selectedRows.has(tx.rowIndex) ? 'selected' : ''}
                                >
                                    <td>
                                        <input
                                            type="checkbox"
                                            checked={selectedRows.has(tx.rowIndex)}
                                            onChange={() => toggleRow(tx.rowIndex)}
                                        />
                                    </td>
                                    <td>{tx.rowIndex}</td>
                                    <td>{tx.transaction_date}</td>
                                    <td>{tx.description || '—'}</td>
                                    <td>{tx.category_name || '—'}</td>
                                    <td>
                                        <span className={`type-badge type-badge--${tx.type?.toLowerCase()}`}>
                                            {tx.type || '—'}
                                        </span>
                                    </td>
                                    <td className="amount-cell">{formatCurrency(typeof tx.amount === 'number' ? tx.amount : parseFloat(tx.amount ?? '0'))}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {validation.invalid.length > 0 && (
                    <div className="import-modal__invalid-section">
                        <h4>Skipped Rows ({validation.invalid.length})</h4>
                        <div className="import-modal__invalid-list">
                            {validation.invalid.slice(0, 5).map((tx) => (
                                <div key={tx.rowIndex} className="import-modal__invalid-item">
                                    <span>Row {tx.rowIndex}:</span>
                                    <span>{tx.errors?.join(', ') || 'No errors specified'}</span>
                                </div>
                            ))}
                            {validation.invalid.length > 5 && (
                                <p className="import-modal__invalid-more">
                                    ...and {validation.invalid.length - 5} more
                                </p>
                            )}
                        </div>
                    </div>
                )}

                {error && (
                    <div className="import-modal__error">
                        <span>⚠️</span> {error}
                    </div>
                )}

                <div className="import-modal__actions">
                    <Button variant="ghost" onClick={() => setStep('upload')}>
                        Back
                    </Button>
                    <Button onClick={handleImport} disabled={selectedCount === 0}>
                        Import {selectedCount} Transaction{selectedCount !== 1 ? 's' : ''}
                    </Button>
                </div>
            </div>
        )
    }

    const renderImportingStep = () => (
        <div className="import-modal__importing">
            <div className="import-modal__spinner">
                <span className="import-modal__spinner-icon">⏳</span>
                <p>Importing transactions...</p>
            </div>
        </div>
    )

    const renderCompleteStep = () => (
        <div className="import-modal__complete">
            <span className="import-modal__complete-icon">✅</span>
            <h3>Import Complete!</h3>
            <p>Your transactions have been successfully imported.</p>
            <Button onClick={handleClose}>Done</Button>
        </div>
    )

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title="Import Transactions" size="large">
            <div className="import-modal">
                {step === 'upload' && renderUploadStep()}
                {step === 'preview' && renderPreviewStep()}
                {step === 'importing' && renderImportingStep()}
                {step === 'complete' && renderCompleteStep()}
            </div>
        </Modal>
    )
}
