import React, { useState, useEffect } from 'react'
import { getTransactions } from '../../services/transactionService'
import { getBudgets } from '../../services/budgetService'
import { VarianceReport } from './VarianceReport'
import { getCurrentMonth } from '../../utils/date'
import './AuditPage.css'

export function AuditPage() {
  const [month, setMonth] = useState(getCurrentMonth())
  const [transactions, setTransactions] = useState([])
  const [budgets, setBudgets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    setLoading(true)
    setError(null)
    Promise.all([getTransactions(month), getBudgets(month)])
      .then(([txs, budgs]) => {
        setTransactions(txs)
        setBudgets(budgs)
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
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
