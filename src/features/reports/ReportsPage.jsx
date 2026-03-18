import React, { useState, useEffect, useCallback } from 'react'
import { getFilteredTransactions } from '../../services/transactionService'
import { TransactionFilters } from './TransactionFilters'
import { RevenueExpenseReport } from './RevenueExpenseReport'
import './ReportsPage.css'

export function ReportsPage() {
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  const [filters, setFilters] = useState({
    id: '',
    startDate: '',
    endDate: '',
    type: 'All',
    category_name: 'All'
  })

  const fetchFiltered = useCallback(async (currentFilters) => {
    setLoading(true)
    setError(null)
    try {
      const data = await getFilteredTransactions(currentFilters)
      setTransactions(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchFiltered(filters)
  }, [fetchFiltered, filters])

  return (
    <div className="reports-page">
      <div className="reports-page__header">
        <h2 className="reports-page__title">Advanced Reports</h2>
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
