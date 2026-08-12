import { useState, useEffect } from 'react'
import { getTransactions } from '../../services/transactionService'
import { getUserBudgets } from '../../services/budgetService'
import { useAuth } from '../../hooks/useAuth'
import { VarianceReport } from './VarianceReport'
import { exportVarianceReportToCSV } from '../../utils/exportUtils'
import { getCurrentMonth, getYearRange, getYearsRange } from '../../utils/date'
import './AuditPage.css'

interface Transaction {
  id: string
  type: string
  amount: string
  category_name: string
  description?: string
  transaction_date?: string
}

interface Budget {
  id: string
  user_id: string
  category: string
  amount: number
  month: string
}

export function AuditPage() {
  const { user } = useAuth()
  const [month, setMonth] = useState(getCurrentMonth())
  const yearsRange = getYearsRange()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const handleExport = () => {
    if (transactions.length === 0) {
      alert('No data available to export for this month.')
      return
    }

    const filename = `variance_report_${month.replace('-', '_')}`

    exportVarianceReportToCSV(transactions, budgets, filename)
  }

  useEffect(() => {
    if (!user?.id) return
    setLoading(true)
    setError(null)

    Promise.all([getTransactions(month), getUserBudgets(user.id, month)])
      .then(([txs, budgs]) => {
        setTransactions(txs)
        setBudgets(budgs)
      })
      .catch((err) => {
        console.error('AuditPage - Error loading data:', err)
        setError(err.message)
      })
      .finally(() => {
        setLoading(false)
      })
  }, [month, user?.id])

  return (
    <div className="audit-page">
      <div className="audit-page__header">
        <h2 className="audit-page__title">Categorical Variance Audit</h2>
        <div className="audit-page__controls">
          <div className="audit-month-year-controls">
            <select
              className="audit-year-selector"
              value={month.split('-')[0]}
              onChange={(e) => setMonth(`${e.target.value}-${month.split('-')[1]}`)}
              aria-label="Select year"
            >
              {yearsRange.map((yr: number) => (
                <option key={yr} value={yr}>{yr}</option>
              ))}
            </select>
            <select
              className="audit-month-selector"
              value={month.split('-')[1]}
              onChange={(e) => setMonth(`${month.split('-')[0]}-${e.target.value}`)}
              aria-label="Select month"
            >
              {getYearRange(parseInt(month.split('-')[0])).map((m: string) => (
                <option key={m} value={m.split('-')[1]}>
                  {new Date(parseInt(m.split('-')[0]), parseInt(m.split('-')[1]) - 1).toLocaleString('en-US', { month: 'long' })}
                </option>
              ))}
            </select>
          </div>
          <button
            className="audit-export-btn"
            onClick={handleExport}
            disabled={loading || transactions.length === 0}
            title="Export variance report to CSV"
          >
            📊 Export CSV
          </button>
        </div>
      </div>

      {error && <div className="audit-page__error">{error}</div>}
      {loading
        ? <p className="audit-page__loading">Loading audit data…</p>
        : <VarianceReport transactions={transactions} budgets={budgets} />
      }
    </div>
  )
}
