import { useState, useEffect } from 'react'
import { getTransactions } from '../../services/transactionService'
import { getBudgets } from '../../services/budgetService'
import { VarianceReport } from './VarianceReport'
import { getCurrentMonth } from '../../utils/date'
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
  amount: string
  month: string
}

export function AuditPage() {
  const [month, setMonth] = useState(getCurrentMonth())
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    setError(null)
    console.log('AuditPage - Fetching data for month:', month)

    Promise.all([getTransactions(month), getBudgets(month)])
      .then(([txs, budgs]) => {
        console.log('AuditPage - Data loaded:', { transactions: txs.length, budgets: budgs.length })
        setTransactions(txs)
        setBudgets(budgs)
      })
      .catch((err) => {
        console.error('AuditPage - Error loading data:', err)
        setError(err.message)
      })
      .finally(() => {
        console.log('AuditPage - Loading complete')
        setLoading(false)
      })
  }, [month])

  return (
    <div className="audit-page">
      <div className="audit-page__header">
        <h2 className="audit-page__title">Categorical Variance Audit</h2>
        <input
          id="audit-month"
          type="month"
          className="audit-month-picker"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          aria-label="Select month"
        />
      </div>

      {error && <div className="audit-page__error">{error}</div>}
      {loading
        ? <p className="audit-page__loading">Loading audit data…</p>
        : <VarianceReport transactions={transactions} budgets={budgets} />
      }
    </div>
  )
}
