import React, { useState, useEffect, useMemo } from 'react'
import { getFilteredTransactions } from '../../services/transactionService'
import { TransactionFilters } from './TransactionFilters'
import { RevenueExpenseReport } from './RevenueExpenseReport'
import { exportReport } from '../../utils/exportUtils'
import { Button } from '../../components/Shared/Button'
import { useToast } from '../../components/Shared/Toast'
import './ReportsPage.css'

interface Transaction {
  id: string
  type: string
  amount: string
  category_name?: string
  description?: string
  transaction_date?: string
}

interface FilterState {
  id: string
  startDate: string
  endDate: string
  type: string
  category_name: string
}

export function ReportsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [filters, setFilters] = useState<FilterState>({
    id: '',
    startDate: '',
    endDate: '',
    type: 'All',
    category_name: 'All'
  })

  const toast = useToast()

  // Fetch filtered transactions
  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      setError(null)
      try {
        const data = await getFilteredTransactions(filters)
        setTransactions(data)
      } catch (err: unknown) {
        setError((err as Error).message)
        toast.error('Failed to load report data')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [filters])

  // Calculate summary for export
  const summary = useMemo(() => {
    const revenue = transactions
      .filter(t => ['income', 'revenue'].includes(t.type?.toLowerCase()))
      .reduce((sum, t) => sum + Number(t.amount), 0)
    const expenses = transactions
      .filter(t => ['expense', 'spending', 'spent'].includes(t.type?.toLowerCase()))
      .reduce((sum, t) => sum + Number(t.amount), 0)
    return {
      revenue,
      expenses,
      net: revenue - expenses,
      startDate: filters.startDate,
      endDate: filters.endDate
    }
  }, [transactions, filters.startDate, filters.endDate])

  const handleExportCSV = () => {
    if (transactions.length === 0) {
      toast.warning('No data to export')
      return
    }
    exportReport(transactions, summary, 'csv', 'revenue_expense_report')
    toast.success('Report exported successfully!')
  }

  const handleExportPDF = () => {
    if (transactions.length === 0) {
      toast.warning('No data to export')
      return
    }
    exportReport(transactions, summary, 'pdf', 'revenue_expense_report')
  }

  return (
    <div className="reports-page">
      <div className="reports-page__header">
        <h2 className="reports-page__title">Advanced Reports</h2>
        <div className="reports-page__actions">
          <Button onClick={handleExportCSV} variant="secondary" disabled={loading || transactions.length === 0}>
            Export CSV
          </Button>
          <Button onClick={handleExportPDF} variant="secondary" disabled={loading || transactions.length === 0}>
            Export PDF
          </Button>
        </div>
      </div>

      <div className="reports-page__content">
        <aside className="reports-page__sidebar">
          <TransactionFilters onFilter={setFilters} />
        </aside>

        <main className="reports-page__main">
          {error && <div className="reports-page__error">{error}</div>}
          {loading ? (
            <div className="reports-page__loading">Loading report data...</div>
          ) : (
            <RevenueExpenseReport transactions={transactions} />
          )}
        </main>
      </div>
    </div>
  )
}
