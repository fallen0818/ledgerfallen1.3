import { useState } from 'react'
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

export function RevenueExpenseReport({ transactions }: { transactions: Transaction[] }) {
  const [visibleCount, setVisibleCount] = useState(50)
  const isRevenue = (t: Transaction) => isRevenueType(t.type)
  const isExpense = (t: Transaction) => isExpenseType(t.type)

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
                {transactions.slice(0, visibleCount).map((tx: Transaction) => (
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
            {transactions.length > visibleCount && (
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
