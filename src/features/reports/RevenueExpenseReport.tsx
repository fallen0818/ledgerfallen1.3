import { useState, useEffect } from 'react'
import { flushSync } from 'react-dom'
import { Card } from '../../components/Shared/Card'
import { formatCurrency } from '../../utils/currency'
import { isRevenueType, isExpenseType } from '../../utils/transactionTypes'
import './RevenueExpenseReport.css'

interface Transaction {
  id: string
  amount: string
  type: string
  transaction_date: string
  description?: string
  category_name: string
}

const DEFAULT_VISIBLE_COUNT = 50

export function RevenueExpenseReport({ transactions }: { transactions: Transaction[] }) {
  const [visibleCount, setVisibleCount] = useState(DEFAULT_VISIBLE_COUNT)
  const [isPrinting, setIsPrinting] = useState(false)
  const isRevenue = (t: Transaction) => isRevenueType(t.type)
  const isExpense = (t: Transaction) => isExpenseType(t.type)

  // Only the first `visibleCount` rows actually exist in the DOM (see below)
  // — printing can't capture rows that were never rendered. Expand to the
  // full list right before any print (our Export PDF button or a direct
  // Ctrl+P), then restore normal pagination afterward. Also switch to
  // zero-filtered rows for print specifically — on-screen browsing still
  // shows everything, including zero-amount rows.
  //
  // flushSync is required here: React normally applies state updates
  // asynchronously, so without it the browser can take its print snapshot
  // before React actually finishes rendering all rows into the DOM.
  useEffect(() => {
    const showAll = () => flushSync(() => {
      setVisibleCount(transactions.length)
      setIsPrinting(true)
    })
    const restore = () => flushSync(() => {
      setVisibleCount(DEFAULT_VISIBLE_COUNT)
      setIsPrinting(false)
    })
    window.addEventListener('beforeprint', showAll)
    window.addEventListener('afterprint', restore)
    return () => {
      window.removeEventListener('beforeprint', showAll)
      window.removeEventListener('afterprint', restore)
    }
  }, [transactions.length])

  // Print output skips zero-amount rows; normal browsing shows everything.
  const displayedTransactions = isPrinting
    ? transactions.filter((t) => Number(t.amount) !== 0)
    : transactions.slice(0, visibleCount)

  const revenue = transactions
    .filter(isRevenue)
    .reduce((sum: number, t: Transaction) => sum + parseFloat(t.amount), 0)

  const expenses = transactions
    .filter(isExpense)
    .reduce((sum: number, t: Transaction) => sum + parseFloat(t.amount), 0)

  const net = revenue - expenses
  const isProfit = net >= 0

  return (
    <div className="re-report">
      <div className="re-report__summary">
        <Card className="re-card re-card--revenue">
          <span className="re-card__label">Total Revenue</span>
          <span className="re-card__value">{formatCurrency(revenue)}</span>
        </Card>
        <Card className="re-card re-card--expenses">
          <span className="re-card__label">Total Expenses</span>
          <span className="re-card__value">{formatCurrency(expenses)}</span>
        </Card>
        <Card className={`re-card re-card--net ${isProfit ? 're-card--profit' : 're-card--loss'}`}>
          <span className="re-card__label">Net {isProfit ? 'Income' : 'Loss'}</span>
          <span className="re-card__value">{isProfit ? '+' : ''}{formatCurrency(Math.abs(net))}</span>
        </Card>
      </div>

      {transactions.length > 0 && (
        <Card className="re-report__breakdown">
          <h3 className="re-report__title">Filtered Results ({transactions.length})</h3>
          <div className="re-report__table-wrap">
            <div className="re-table-wrapper">
              <table className="re-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Description</th>
                  <th>Category</th>
                  <th>Type</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                {displayedTransactions.map((tx: Transaction) => (
                  <tr key={tx.id} className={`re-row--${tx.type.toLowerCase()}`}>
                    <td>{tx.transaction_date}</td>
                    <td>{tx.description}</td>
                    <td><span className="re-tag">{tx.category_name}</span></td>
                    <td>{tx.type}</td>
                    <td className="re-amount">{formatCurrency(Number(tx.amount))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
            {!isPrinting && transactions.length > visibleCount && (
              <div className="re-report__actions">
                <button
                  className="re-report__next-btn"
                  onClick={() => setVisibleCount(prev => prev + 50)}
                >
                  Show Next 50
                </button>
                <span className="re-report__count">
                  Showing {visibleCount} of {transactions.length} results
                </span>
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  )
}
